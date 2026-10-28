// Conexión entre los dos jugadores del cooperativo.
// - La sala (código, quién está, señalización) va por Supabase Realtime.
// - La partida va por conexión directa WebRTC (P2P). Si no se puede abrir (redes muy cerradas),
//   los mensajes siguen pasando por Supabase ("por servidor"), con menos fotos por segundo.
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { t } from '../i18n';

export type Role = 'host' | 'guest';
export type LinkMode = 'connecting' | 'p2p' | 'relay';
export interface Msg { type: string; [k: string]: unknown }
export interface PeerInfo { id: string; name: string; role: Role }

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ICE: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
export const newRoomCode = () => Array.from({ length: 4 }, () => ALPHABET[(Math.random() * ALPHABET.length) | 0]).join('');

export class CoopLink {
  readonly code: string;
  readonly role: Role;
  readonly selfId = crypto.randomUUID();
  readonly name: string;
  peer: PeerInfo | null = null;
  mode: LinkMode = 'connecting';
  /** Cambios de compañero / modo de conexión (para la interfaz). */
  onStatus: () => void = () => {};
  private ch: RealtimeChannel;
  private pc: RTCPeerConnection | null = null;
  private rel: RTCDataChannel | null = null;    // ordenado y fiable: órdenes, elecciones, fin
  private fast: RTCDataChannel | null = null;   // sin reintentos: fotos de la partida y entradas
  private handlers = new Map<string, ((m: Msg) => void)[]>();
  private closed = false;
  private p2pTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingIce: RTCIceCandidateInit[] = [];

  private constructor(code: string, role: Role, name: string) {
    if (!supabase) throw new Error(t('El modo cooperativo necesita conexión con el servidor'));
    this.code = code; this.role = role; this.name = name;
    this.ch = supabase.channel(`vs-coop-${code}`, { config: { broadcast: { self: false, ack: false }, presence: { key: this.selfId } } });
  }

  /** Crea una sala nueva con un código libre. */
  static async host(name: string) {
    for (let tries = 0; tries < 4; tries++) {
      const link = new CoopLink(newRoomCode(), 'host', name);
      await link.join();
      if (!(await link.othersPresent()).some(p => p.role === 'host')) return link;
      await link.close();          // código ocupado: probar otro
    }
    throw new Error(t('No se pudo crear la sala. Inténtalo de nuevo'));
  }

  /** Entra en la sala de un amigo. */
  static async guest(code: string, name: string) {
    const link = new CoopLink(code.trim().toUpperCase(), 'guest', name);
    await link.join();
    let others: PeerInfo[] = [];
    for (let i = 0; i < 6 && !others.some(p => p.role === 'host'); i++) { await wait(400); others = await link.othersPresent(); }
    const host = others.find(p => p.role === 'host');
    if (!host) { await link.close(); throw new Error(t('No existe ninguna sala con ese código')); }
    if (others.some(p => p.role === 'guest')) { await link.close(); throw new Error(t('Esa sala ya está llena')); }
    link.peer = host;
    link.onStatus();
    return link;
  }

  private join() {
    return new Promise<void>((resolve, reject) => {
      this.ch.on('broadcast', { event: 'm' }, ({ payload }) => this.receive(payload as Msg));
      this.ch.on('broadcast', { event: 'sig' }, ({ payload }) => this.signal(payload as Msg));
      this.ch.on('presence', { event: 'sync' }, () => this.presence());
      this.ch.subscribe(async status => {
        if (status === 'SUBSCRIBED') { await this.ch.track({ name: this.name, role: this.role }); resolve(); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(new Error(t('No se pudo conectar con el servidor de salas')));
      });
    });
  }

  private async othersPresent(): Promise<PeerInfo[]> {
    const st = this.ch.presenceState() as Record<string, { name: string; role: Role }[]>;
    return Object.entries(st).filter(([id]) => id !== this.selfId).map(([id, v]) => ({ id, name: v[0]?.name ?? 'Jugador', role: v[0]?.role ?? 'guest' }));
  }

  private async presence() {
    const others = await this.othersPresent();
    const want: Role = this.role === 'host' ? 'guest' : 'host';
    const p = others.find(o => o.role === want) ?? null;
    if (p && (!this.peer || this.peer.id !== p.id)) {
      this.peer = p;
      this.onStatus();
      if (this.role === 'host') this.startP2P();
    } else if (!p && this.peer) {
      this.peer = null;
      this.resetP2P();
      this.emit({ type: 'peer-left' });
      this.onStatus();
    }
  }

  /* ------------------------------------------------------------------ WebRTC */
  private makePc() {
    this.resetP2P();
    const pc = new RTCPeerConnection({ iceServers: ICE });
    this.pc = pc;
    pc.onicecandidate = ev => { if (ev.candidate) this.ch.send({ type: 'broadcast', event: 'sig', payload: { type: 'ice', to: this.peer?.id, c: ev.candidate.toJSON() } }); };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') this.toRelay();
    };
    pc.ondatachannel = ev => this.bindChannel(ev.channel);
    // si en unos segundos no hay conexión directa, se juega por servidor
    this.p2pTimer = setTimeout(() => { if (this.mode !== 'p2p') this.toRelay(); }, 8000);
    return pc;
  }
  private async startP2P() {
    if (typeof RTCPeerConnection === 'undefined') { this.toRelay(); return; }
    const pc = this.makePc();
    this.bindChannel(pc.createDataChannel('rel', { ordered: true }));
    this.bindChannel(pc.createDataChannel('fast', { ordered: false, maxRetransmits: 0 }));
    await pc.setLocalDescription(await pc.createOffer());
    this.ch.send({ type: 'broadcast', event: 'sig', payload: { type: 'offer', to: this.peer?.id, sdp: pc.localDescription } });
  }
  private async signal(m: Msg) {
    if (m.to && m.to !== this.selfId) return;
    try {
      if (m.type === 'offer' && this.role === 'guest') {
        const pc = this.makePc();
        await pc.setRemoteDescription(m.sdp as RTCSessionDescriptionInit);
        for (const c of this.pendingIce.splice(0)) await pc.addIceCandidate(c);
        await pc.setLocalDescription(await pc.createAnswer());
        this.ch.send({ type: 'broadcast', event: 'sig', payload: { type: 'answer', to: this.peer?.id, sdp: pc.localDescription } });
      } else if (m.type === 'answer' && this.pc) {
        await this.pc.setRemoteDescription(m.sdp as RTCSessionDescriptionInit);
        for (const c of this.pendingIce.splice(0)) await this.pc.addIceCandidate(c);
      } else if (m.type === 'ice') {
        if (this.pc?.remoteDescription) await this.pc.addIceCandidate(m.c as RTCIceCandidateInit);
        else this.pendingIce.push(m.c as RTCIceCandidateInit);
      }
    } catch { this.toRelay(); }
  }
  private bindChannel(dc: RTCDataChannel) {
    if (dc.label === 'rel') this.rel = dc; else this.fast = dc;
    dc.onmessage = ev => { try { this.receive(JSON.parse(ev.data)); } catch { /* mensaje dañado */ } };
    dc.onopen = () => { if (this.rel?.readyState === 'open' && this.fast?.readyState === 'open') { this.mode = 'p2p'; this.onStatus(); } };
    dc.onclose = () => { if (this.mode === 'p2p') this.toRelay(); };
  }
  private toRelay() {
    if (this.closed || this.mode === 'relay') return;
    this.mode = 'relay';
    this.onStatus();
  }
  private resetP2P() {
    if (this.p2pTimer) { clearTimeout(this.p2pTimer); this.p2pTimer = null; }
    this.rel?.close(); this.fast?.close(); this.pc?.close();
    this.rel = this.fast = null; this.pc = null; this.pendingIce = [];
    if (this.mode === 'p2p') this.mode = 'connecting';
  }

  /* ------------------------------------------------------------------ mensajes */
  on(type: string, fn: (m: Msg) => void) {
    const list = this.handlers.get(type) ?? [];
    list.push(fn); this.handlers.set(type, list);
    return () => this.handlers.set(type, (this.handlers.get(type) ?? []).filter(f => f !== fn));
  }
  private emit(m: Msg) { for (const fn of this.handlers.get(m.type) ?? []) fn(m); }
  private receive(m: Msg) { if (m && typeof m.type === 'string') this.emit(m); }

  /** fast = puede perderse (fotos, entradas): va por el canal sin reintentos. */
  send(m: Msg, fast = false) {
    if (this.closed) return;
    const dc = fast ? this.fast : this.rel;
    if (this.mode === 'p2p' && dc?.readyState === 'open') {
      try { dc.send(JSON.stringify(m)); return; } catch { /* cae al servidor */ }
    }
    this.ch.send({ type: 'broadcast', event: 'm', payload: m });
  }
  /** Fotos por segundo que admite la conexión actual. */
  get snapshotRate() { return this.mode === 'p2p' ? 15 : 6; }

  async close() {
    if (this.closed) return;
    this.send({ type: 'bye' });
    this.closed = true;
    this.resetP2P();
    try { await this.ch.untrack(); } catch { /* sin conexión */ }
    await supabase?.removeChannel(this.ch);
  }
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
