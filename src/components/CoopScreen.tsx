import { useEffect, useMemo, useRef, useState } from 'react';
import { AGENTS, AGENT_BY_ID, EXCLUSIVE_AGENTS, Kit, withKit } from '../data/agents';
import { MAPS } from '../data/maps';
import { DIFFICULTIES } from '../data/difficulty';
import { WEAPONS } from '../data/weapons';
import { SaveData, MetaLevels } from '../utils/storage';
import { CoopLink } from '../net/coopLink';
import { AgentPortrait } from './AgentPortrait';
import { audio } from '../utils/audio';
import { t } from '../i18n';

/** Lo que cada jugador lleva a la partida (viaja por la red). */
export interface CoopSetup { agentId: string; kit?: Kit; loadout: string; meta: MetaLevels; name: string }
/** seed: semilla del mundo, para que anfitrión e invitado vean el mismo mapa. */
export interface CoopStart { mapId: string; difficulty: string; setups: CoopSetup[]; seed: number }
interface LobbyState extends CoopSetup { ready: boolean; mapId?: string; difficulty?: string }

interface Props {
  save: SaveData;
  name: string;
  back: () => void;
  /** Empieza la partida: link abierto, datos de la partida e índice del jugador local. */
  onStart: (link: CoopLink, start: CoopStart, local: number) => void;
}

const MODE_TEXT = { connecting: 'Conectando…', p2p: 'Conexión directa', relay: 'Conexión por servidor' } as const;

/** Sala del modo cooperativo: crear o unirse con un código, elegir agente y empezar. */
export function CoopScreen({ save, name, back, onStart }: Props) {
  const [link, setLink] = useState<CoopLink | null>(null);
  const [, force] = useState(0);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const roster = useMemo(() => [...AGENTS.filter(a => save.unlocked.includes(a.id)), ...EXCLUSIVE_AGENTS.filter(a => save.exclusives.includes(a.id))], [save]);
  const [agentId, setAgentId] = useState(roster.some(a => a.id === save.lastAgent) ? save.lastAgent : roster[0]?.id ?? 'jett');
  const [mapId, setMapId] = useState(save.lastMap);
  const [difficulty, setDifficulty] = useState(save.lastDifficulty);
  const [ready, setReady] = useState(false);
  const [peerState, setPeerState] = useState<LobbyState | null>(null);
  const started = useRef(false);

  const loadout = WEAPONS[save.loadout] && (!WEAPONS[save.loadout].exclusive || save.exclusives.includes(save.loadout)) ? save.loadout : 'classic';
  const mine: LobbyState = { agentId, kit: save.kits[agentId], loadout, meta: save.meta, name, ready: link?.role === 'host' ? true : ready, mapId, difficulty };

  // al salir de la pantalla sin empezar, se cierra la sala
  useEffect(() => () => { if (!started.current) link?.close(); }, [link]);

  useEffect(() => {
    if (!link) return;
    link.onStatus = () => force(n => n + 1);
    const offs = [
      link.on('lobby', m => setPeerState(m.state as LobbyState)),
      link.on('peer-left', () => { setPeerState(null); setReady(false); }),
      link.on('bye', () => { setPeerState(null); setReady(false); }),
      link.on('start', m => {
        if (link.role !== 'guest') return;
        started.current = true;
        onStart(link, m.start as CoopStart, 1);
      }),
    ];
    return () => offs.forEach(f => f());
  }, [link, onStart]);

  // cada cambio propio (o la llegada del compañero) se envía al otro jugador
  const peerId = link?.peer?.id;
  useEffect(() => { if (link?.peer) link.send({ type: 'lobby', state: mine }); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [link, peerId, agentId, mapId, difficulty, ready]);

  const create = async () => {
    setBusy(true); setError(''); audio.play('click');
    try { setLink(await CoopLink.host(name)); } catch (e: any) { setError(String(e?.message ?? e)); }
    setBusy(false);
  };
  const join = async () => {
    if (code.trim().length !== 4) { setError(t('El código tiene 4 caracteres')); return; }
    setBusy(true); setError(''); audio.play('click');
    try { setLink(await CoopLink.guest(code, name)); } catch (e: any) { setError(String(e?.message ?? e)); }
    setBusy(false);
  };
  const leave = async () => { audio.play('click'); await link?.close(); setLink(null); setPeerState(null); setReady(false); };
  const start = () => {
    if (!link || !peerState) return;
    audio.play('click');
    const strip = (s: LobbyState): CoopSetup => ({ agentId: s.agentId, kit: s.kit, loadout: s.loadout, meta: s.meta, name: s.name });
    const st: CoopStart = { mapId, difficulty, setups: [strip(mine), strip(peerState)], seed: Math.floor(Math.random() * 2147483647) };
    link.send({ type: 'start', start: st });
    started.current = true;
    onStart(link, st, 0);
  };

  if (!link) {
    return (
      <div className="screen coop">
        <header className="top">
          <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>
          <h2>{t('Jugar en pareja')}</h2>
          <span />
        </header>
        <div className="coop-start">
          <section className="coop-box">
            <h3>{t('Crear sala')}</h3>
            <p>{t('Crea una sala y pásale el código a tu amigo.')}</p>
            <button className="btn btn-red btn-xl" disabled={busy} onClick={create}><b>{t('Crear sala')}</b></button>
          </section>
          <section className="coop-box">
            <h3>{t('Unirse')}</h3>
            <p>{t('Escribe el código que te ha pasado tu amigo.')}</p>
            <form onSubmit={e => { e.preventDefault(); join(); }}>
              <input className="coop-code-input" value={code} maxLength={4} placeholder="ABCD" onChange={e => setCode(e.target.value.toUpperCase())} aria-label={t('Código de sala')} />
              <button className="btn btn-xl" type="submit" disabled={busy}><b>{t('Unirse')}</b></button>
            </form>
          </section>
        </div>
        {error && <p className="rank-err coop-err" role="alert">{error}</p>}
        <p className="lead coop-note">{t('Partida para 2 jugadores contra las mismas oleadas. Si caes, vuelves en la siguiente oleada. Las partidas en pareja no cuentan para el ranking.')}</p>
      </div>
    );
  }

  const isHost = link.role === 'host';
  const agent = withKit(AGENT_BY_ID[agentId] ?? AGENTS[0], save.kits[agentId]);
  const peerAgent = peerState ? AGENT_BY_ID[peerState.agentId] : null;
  const shownMap = isHost ? mapId : peerState?.mapId ?? mapId;
  const shownDiff = isHost ? difficulty : peerState?.difficulty ?? difficulty;
  return (
    <div className="screen coop">
      <header className="top">
        <button className="btn btn-sm" onClick={leave}><b>{t('Salir de la sala')}</b></button>
        <h2>{t('Sala')} <span className="coop-code">{link.code}</span></h2>
        <span className={`coop-mode ${link.mode}`}>{link.peer ? t(MODE_TEXT[link.mode]) : t('Esperando…')}</span>
      </header>
      <div className="coop-lobby">
        <section className="coop-slot" style={{ ['--ac' as any]: agent.color }}>
          <small>{isHost ? t('Anfitrión') : t('Invitado')} · {t('Tú')}</small>
          <div className="coop-portrait"><AgentPortrait agent={agent} /></div>
          <b>{name}</b>
          <select value={agentId} onChange={e => { audio.play('click'); setAgentId(e.target.value); setReady(false); }}>
            {roster.map(a => <option key={a.id} value={a.id}>{t(a.name)}{a.exclusive ? ' ★' : ''}</option>)}
          </select>
          {!isHost && (
            <button className={`btn ${ready ? '' : 'btn-red'}`} onClick={() => { audio.play('click'); setReady(r => !r); }}><b>{ready ? t('No estoy listo') : t('Estoy listo')}</b></button>
          )}
        </section>
        <section className="coop-slot" style={{ ['--ac' as any]: peerAgent?.color ?? '#34495c' }}>
          <small>{isHost ? t('Invitado') : t('Anfitrión')}</small>
          {peerState && peerAgent ? (
            <>
              <div className="coop-portrait"><AgentPortrait agent={peerAgent} /></div>
              <b>{peerState.name}</b>
              <span>{t(peerAgent.name)}</span>
              <span className={peerState.ready ? 'coop-ready' : 'coop-wait'}>{peerState.ready ? t('Listo') : t('Eligiendo…')}</span>
            </>
          ) : (
            <div className="coop-empty">
              <p>{t('Esperando a tu compañero…')}</p>
              <p>{t('Código')}: <span className="coop-code">{link.code}</span></p>
            </div>
          )}
        </section>
      </div>
      <div className="coop-settings">
        <div className="map-pick" role="radiogroup" aria-label={t('Mapa')}>
          {MAPS.map(m => (
            <button key={m.id} role="radio" aria-checked={m.id === shownMap} disabled={!isHost} className={`map-chip ${m.id === shownMap ? 'on' : ''}`} onClick={() => { audio.play('click'); setMapId(m.id); }}>
              <i style={{ background: m.colors.wallTop }} /><b>{m.name}</b>
            </button>
          ))}
        </div>
        <div className="map-pick" role="radiogroup" aria-label={t('Dificultad')}>
          {DIFFICULTIES.map(d => (
            <button key={d.id} role="radio" aria-checked={d.id === shownDiff} disabled={!isHost} className={`map-chip ${d.id === shownDiff ? 'on' : ''}`} onClick={() => { audio.play('click'); setDifficulty(d.id); }}>
              <i style={{ background: d.color }} /><b>{t(d.name)}</b>
            </button>
          ))}
        </div>
        {isHost
          ? <button className="btn btn-red btn-xl" disabled={!peerState?.ready} onClick={start}><b>{peerState ? (peerState.ready ? t('Empezar partida') : t('Esperando a que esté listo')) : t('Esperando compañero')}</b></button>
          : <p className="lead">{t('El anfitrión elige mapa y dificultad y empieza la partida.')}</p>}
      </div>
    </div>
  );
}
