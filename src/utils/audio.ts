// Audio 100% sintetizado con WebAudio: no depende de archivos externos.
// Los efectos suenan según el elemento (un rayo cruje y truena, el fuego sopla y chisporrotea, el hielo tintinea…)
// y la música es ambiental: colchones de acordes, notas con eco, reverberación y un sonido de fondo por zona.
type Ctx = AudioContext;

/** Opciones de una voz: envolvente, filtro y cuánto va a la reverberación. */
interface V { type?: OscillatorType; f2?: number; attack?: number; cut?: number; cut2?: number; q?: number; detune?: number; rev?: number; echo?: number; delay?: number; music?: boolean }
interface N { type?: BiquadFilterType; f2?: number; attack?: number; q?: number; rev?: number; delay?: number; music?: boolean }

class AudioSystem {
  private ctx: Ctx | null = null;
  private master!: GainNode;
  private sfxG!: GainNode;
  private musicG!: GainNode;
  private sfxRev!: GainNode;
  private musicRev!: GainNode;
  private echoIn!: GainNode;
  private echoD!: DelayNode;
  private noiseBuf: AudioBuffer | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  private nextT = 0;
  private musicWanted = false;
  private intensity = 0;
  private songId = 'menu';
  private wantSong = 'menu';
  sfxOn = true;
  musicOn = true;
  sfxVol = 0.7;
  musicVol = 0.4;

  /** Debe llamarse tras un gesto del usuario (clic / tecla). */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC() as Ctx;
    this.master = c.createGain(); this.master.gain.value = 0.8;
    // un compresor suave evita que se sature cuando suenan muchas cosas a la vez
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(c.destination);
    this.sfxG = c.createGain(); this.sfxG.connect(this.master);
    this.musicG = c.createGain(); this.musicG.connect(this.master);
    const len = c.sampleRate * 2;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // reverberación: una sala generada (ruido que se apaga), una para efectos y otra para la música
    const room = (secs: number) => {
      const n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const x = b.getChannelData(ch); for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2.5; }
      return b;
    };
    const conv = (secs: number, out: AudioNode) => { const v = c.createConvolver(); v.buffer = room(secs); const g = c.createGain(); g.connect(v); v.connect(out); return g; };
    this.sfxRev = conv(1.6, this.sfxG);
    this.musicRev = conv(3.2, this.musicG);
    // eco para la música (se ajusta al tempo de cada tema)
    this.echoIn = c.createGain();
    this.echoD = c.createDelay(2); this.echoD.delayTime.value = 0.4;
    const fb = c.createGain(); fb.gain.value = 0.38;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    this.echoIn.connect(this.echoD); this.echoD.connect(lp); lp.connect(fb); fb.connect(this.echoD); lp.connect(this.musicG); lp.connect(this.musicRev);
    this.apply();
    if (this.musicWanted) this.startMusic();
  }
  configure(s: { sfxOn: boolean; musicOn: boolean; sfxVol: number; musicVol: number }) {
    this.sfxOn = s.sfxOn; this.musicOn = s.musicOn; this.sfxVol = s.sfxVol; this.musicVol = s.musicVol;
    this.apply();
  }
  private apply() {
    if (!this.ctx) return;
    this.sfxG.gain.value = this.sfxOn ? this.sfxVol : 0;
    this.musicG.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicG.gain.value = this.musicOn ? this.musicVol * 0.6 : 0;
  }
  setIntensity(v: number) { this.intensity = v; }

  /** Una nota: oscilador (o dos desafinados) → filtro opcional → envolvente → salida, reverberación y eco. */
  private tone(f: number, dur: number, vol: number, o: V = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + (o.delay ?? 0), att = o.attack ?? 0.008;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(att + 0.02, dur));
    let head: AudioNode = g;
    if (o.cut) {
      const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = o.q ?? 0.7;
      fl.frequency.setValueAtTime(o.cut, t); if (o.cut2) fl.frequency.exponentialRampToValueAtTime(o.cut2, t + dur);
      fl.connect(g); head = fl;
    }
    for (const det of o.detune ? [-o.detune, o.detune] : [0]) {
      const osc = c.createOscillator(); osc.type = o.type ?? 'sine'; osc.detune.value = det;
      osc.frequency.setValueAtTime(f, t);
      if (o.f2 && o.f2 !== f) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + dur);
      osc.connect(head); osc.start(t); osc.stop(t + dur + 0.05);
    }
    this.route(g, o.rev, o.echo, o.music);
  }
  /** Ruido filtrado (soplidos, chasquidos, truenos, viento…). */
  private noise(dur: number, vol: number, freq: number, o: N = {}) {
    if (!this.ctx || !this.noiseBuf) return;
    const c = this.ctx, t = c.currentTime + (o.delay ?? 0), att = o.attack ?? 0.004;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const fl = c.createBiquadFilter(); fl.type = o.type ?? 'lowpass'; fl.Q.value = o.q ?? 0.8;
    fl.frequency.setValueAtTime(freq, t); if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(att + 0.02, dur));
    s.connect(fl); fl.connect(g);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    this.route(g, o.rev, 0, o.music);
  }
  private route(g: GainNode, rev = 0, echo = 0, music = false) {
    const c = this.ctx!;
    g.connect(music ? this.musicG : this.sfxG);
    if (rev > 0) { const r = c.createGain(); r.gain.value = rev; g.connect(r); r.connect(music ? this.musicRev : this.sfxRev); }
    if (echo > 0) { const e = c.createGain(); e.gain.value = echo; g.connect(e); e.connect(this.echoIn); }
  }
  /** Chisporroteo: chasquidos sueltos durante `dur` segundos. */
  private crackle(n: number, dur: number, vol: number, delay = 0, music = false) {
    for (let i = 0; i < n; i++) this.noise(0.012 + Math.random() * 0.02, vol * (0.4 + Math.random() * 0.6), 2500 + Math.random() * 3500, { type: 'highpass', delay: delay + Math.random() * dur, music });
  }

  /* ------------------------------------------------------------------ efectos por elemento */
  private thunder(big: number) {
    this.noise(0.09, 0.55 * big, 2200, { type: 'highpass', rev: 0.3 });                     // chasquido
    this.tone(2400, 0.14, 0.09 * big, { type: 'sawtooth', f2: 140, cut: 5000 });               // zas
    this.crackle(6, 0.12, 0.25 * big);
    this.noise(1.3 * big, 0.4 * big, 260, { f2: 50, attack: 0.04, delay: 0.05, rev: 0.6 });  // trueno que retumba
  }
  private fire(big: number) {
    this.noise(0.55 * big, 0.35 * big, 380, { type: 'bandpass', f2: 2600, q: 1.1, attack: 0.1, rev: 0.25 }); // soplido
    this.noise(0.7 * big, 0.28 * big, 320, { f2: 120, attack: 0.05 });                                     // rugido
    this.crackle(Math.round(10 * big), 0.6 * big, 0.18);
  }
  private boom(big: number) {
    this.noise(0.7 * big, 0.5 * big, 1100, { f2: 70, rev: 0.35 });
    this.tone(95, 0.55 * big, 0.4 * big, { f2: 32 });
    this.crackle(5, 0.3, 0.15, 0.05);
  }
  private ice(big: number) {
    const notes = [1568, 2093, 2349, 2637, 3136];
    notes.forEach((f, i) => this.tone(f * (0.98 + Math.random() * 0.04), 0.6, 0.05 * big, { delay: i * 0.035 + Math.random() * 0.02, rev: 0.6 }));
    this.noise(0.12, 0.25 * big, 6500, { type: 'highpass', rev: 0.3 });                          // cristales que se rompen
    this.noise(0.5 * big, 0.12 * big, 1800, { type: 'bandpass', f2: 600, attack: 0.05, rev: 0.4 }); // aire helado
  }
  private water(big: number, heal = false) {
    for (let i = 0; i < 6; i++) { const f = 280 + Math.random() * 260; this.tone(f, 0.09, 0.07 * big, { f2: f * 2.6, delay: i * 0.05 + Math.random() * 0.03, rev: 0.3 }); }
    this.noise(0.45 * big, 0.2 * big, 1400, { f2: 500, attack: 0.03, rev: 0.4 });                // salpicón
    if (heal) [523, 659, 784].forEach((f, i) => this.tone(f, 0.9, 0.05, { type: 'triangle', attack: 0.06, delay: 0.05 + i * 0.06, rev: 0.7 }));
  }
  private wind(big: number, blades = false) {
    this.noise(0.5 * big, 0.38 * big, 300, { type: 'bandpass', f2: 3200, q: 2.2, attack: 0.12, rev: 0.25 });
    if (blades) for (let i = 0; i < 3; i++) this.tone(2800 + i * 400, 0.12, 0.05, { type: 'triangle', f2: 2200, delay: 0.05 + i * 0.06 });
  }
  private holy(big: number) {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 1.1 * big, 0.055, { type: 'triangle', attack: 0.08, delay: i * 0.04, detune: 6, rev: 0.8 }));
    this.noise(0.8 * big, 0.06, 8000, { type: 'highpass', attack: 0.2, rev: 0.6 });               // brillo
  }
  private dark(big: number) {
    this.tone(82, 0.9 * big, 0.16 * big, { type: 'sawtooth', f2: 55, cut: 700, cut2: 200, detune: 18, attack: 0.05, rev: 0.5 });
    this.noise(0.7 * big, 0.22 * big, 300, { type: 'bandpass', f2: 1400, attack: 0.55, rev: 0.6 }); // aspiración que crece
    this.tone(330, 0.6, 0.04, { type: 'sine', f2: 220, delay: 0.1, rev: 0.7 });
  }
  private poison(big: number) {
    for (let i = 0; i < 7; i++) { const f = 140 + Math.random() * 120; this.tone(f, 0.12, 0.08 * big, { f2: f * 2, delay: Math.random() * 0.45, cut: 900 }); }
    this.noise(0.5 * big, 0.15 * big, 700, { f2: 250, attack: 0.08, rev: 0.3 });
  }
  private mech(kind: string, big: number) {
    if (kind === 'arrow') { this.tone(420, 0.16, 0.12, { type: 'triangle', f2: 260 }); this.noise(0.12, 0.2, 2600, { type: 'bandpass', f2: 900 }); return; }
    if (kind === 'turret') { this.tone(1400, 0.03, 0.08, { type: 'square', cut: 3000 }); this.tone(260, 0.25, 0.08, { type: 'sawtooth', f2: 620, cut: 1200, delay: 0.04 }); this.tone(1800, 0.03, 0.06, { type: 'square', cut: 3000, delay: 0.3 }); return; }
    if (kind === 'stim') { this.tone(300, 0.35 * big, 0.1, { type: 'sawtooth', f2: 1200, cut: 2000, rev: 0.2 }); this.noise(0.2, 0.12, 4000, { type: 'highpass', delay: 0.05 }); return; }
    if (kind === 'scan') { [880, 1320, 1760].forEach((f, i) => this.tone(f, 0.18, 0.05, { type: 'sine', delay: i * 0.07, rev: 0.5 })); return; }
    // granadas, cohetes y bombardeos: silbido y explosión
    this.noise(0.3, 0.18, 2400, { type: 'bandpass', f2: 500, q: 3 });
    this.boom(big);
  }
  /** Sonido de una habilidad según su efecto; la definitiva suena más grande. */
  private ability(fx: string, ult: boolean) {
    const big = ult ? 1.5 : 1;
    switch (fx) {
      case 'electric': this.thunder(big); break;
      case 'fire': case 'hothands': this.fire(big); break;
      case 'boom': case 'grenade': case 'rocket': case 'orbital': this.mech(fx, big); break;
      case 'ice': this.ice(big); break;
      case 'water': this.water(big); break;
      case 'heal': this.water(big, true); break;
      case 'wind': this.wind(big); break;
      case 'blades': this.wind(big, true); break;
      case 'holy': this.holy(big); break;
      case 'soul': case 'shadow': case 'paranoia': case 'gravity': this.dark(big); break;
      case 'poison': this.poison(big); break;
      case 'arrow': case 'scan': case 'turret': case 'stim': case 'wire': this.mech(fx, big); break;
      default: this.tone(220, 0.25, 0.1, { type: 'sawtooth', f2: 880, cut: 2000, rev: 0.3 }); this.noise(0.2, 0.1, 1800, { type: 'bandpass' });
    }
    if (ult) this.noise(1.2, 0.25, 180, { f2: 60, attack: 0.1, rev: 0.6 });   // retumbo de la definitiva
  }
  /** Disparo del poder automático según cómo es el proyectil (bajito: suena muchas veces). */
  private shot(look: string) {
    switch (look) {
      case 'bolt': this.tone(1600, 0.07, 0.045, { type: 'sawtooth', f2: 300, cut: 4000 }); this.noise(0.03, 0.08, 5000, { type: 'highpass' }); break;
      case 'flame': this.noise(0.14, 0.12, 700, { type: 'bandpass', f2: 2200, attack: 0.03 }); this.crackle(2, 0.1, 0.06); break;
      case 'ice': this.tone(2600, 0.08, 0.035, { f2: 1900 }); this.noise(0.03, 0.06, 8000, { type: 'highpass' }); break;
      case 'water': this.tone(420, 0.07, 0.06, { f2: 1100 }); break;
      case 'arrow': this.tone(380, 0.09, 0.07, { type: 'triangle', f2: 250 }); this.noise(0.05, 0.06, 2600, { type: 'bandpass' }); break;
      case 'dagger': this.noise(0.06, 0.1, 4500, { type: 'highpass', f2: 9000 }); break;
      case 'leaf': this.noise(0.08, 0.07, 2800, { type: 'bandpass', f2: 4200, q: 2 }); break;
      case 'wisp': this.tone(880, 0.12, 0.035, { f2: 560, rev: 0.4 }); break;
      case 'rock': this.tone(160, 0.1, 0.12, { f2: 70 }); this.noise(0.07, 0.1, 600); break;
      case 'star': this.tone(1320, 0.08, 0.035, { type: 'triangle', f2: 1760, rev: 0.3 }); break;
      case 'disc': this.tone(900, 0.07, 0.04, { type: 'triangle', f2: 1300 }); break;
      default: this.tone(700, 0.06, 0.05, { type: 'triangle', f2: 340, cut: 2500 });
    }
  }

  play(name: string) {
    if (!this.ctx || !this.sfxOn) return;
    if (name.startsWith('shot_')) return this.shot(name.slice(5));
    if (name.startsWith('ab_')) return this.ability(name.slice(3), false);
    if (name.startsWith('ult_')) return this.ability(name.slice(4), true);
    switch (name) {
      case 'shoot': this.shot(''); break;
      case 'shoot_heavy': this.shot('rock'); break;
      case 'hit': this.noise(0.035, 0.07, 2500, { type: 'bandpass' }); break;
      case 'crit': this.tone(1200, 0.08, 0.06, { type: 'triangle', f2: 1800 }); this.noise(0.05, 0.1, 4000, { type: 'highpass' }); break;
      case 'kill': this.noise(0.08, 0.1, 1200, { type: 'bandpass', f2: 300 }); this.tone(300, 0.07, 0.04, { type: 'triangle', f2: 600 }); break;
      case 'gem': this.tone(1300 + Math.random() * 400, 0.07, 0.03, { f2: 1900, rev: 0.2 }); break;
      case 'pick': this.tone(660, 0.12, 0.08, { type: 'triangle', rev: 0.3 }); this.tone(990, 0.18, 0.08, { type: 'triangle', delay: 0.07, rev: 0.3 }); break;
      case 'levelup': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, 0.09, { type: 'triangle', delay: i * 0.07, rev: 0.5 })); break;
      case 'ability': this.ability('', false); break;
      case 'ult': this.ability('', true); break;
      case 'hurt': this.tone(170, 0.18, 0.12, { type: 'sawtooth', f2: 70, cut: 900 }); this.noise(0.08, 0.12, 800); break;
      case 'explosion': this.boom(1); break;
      case 'thunder': this.thunder(1); break;
      case 'fire_breath': this.fire(1.8); break;
      case 'web': this.noise(0.25, 0.25, 900, { type: 'bandpass', f2: 300, q: 2 }); this.tone(200, 0.2, 0.08, { f2: 90, cut: 600 }); break;
      case 'shield': this.tone(220, 0.8, 0.12, { type: 'sawtooth', f2: 440, cut: 1500, detune: 12, rev: 0.6 }); this.tone(880, 0.6, 0.05, { delay: 0.2, rev: 0.6 }); break;
      case 'blink': this.dark(1); break;
      case 'boss': this.tone(70, 1.4, 0.25, { type: 'sawtooth', f2: 55, cut: 500, detune: 20, rev: 0.6 }); this.noise(1.2, 0.3, 200, { f2: 60, rev: 0.6 }); break;
      case 'warn': this.tone(620, 0.12, 0.05, { type: 'triangle', rev: 0.2 }); break;
      case 'wave': this.tone(98, 1, 0.2, { type: 'sawtooth', cut: 800, detune: 15, rev: 0.6 }); this.noise(0.8, 0.12, 400, { attack: 0.3, rev: 0.5 }); break;
      case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.7, 0.1, { type: 'triangle', delay: i * 0.12, rev: 0.7 })); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.8, 0.1, { type: 'triangle', f2: f * 0.97, delay: i * 0.25, rev: 0.7 })); break;
      case 'click': this.tone(800, 0.04, 0.05, { type: 'triangle', f2: 600 }); break;
      case 'hover': this.tone(1400, 0.03, 0.02); break;
    }
  }

  /* ------------------------------------------------------------------ música ambiental
     Cada tema es un bucle de 4 compases de 16 pasos: un colchón con el acorde de cada compás, notas sueltas con eco,
     a veces bajo y percusión suave, y un sonido de fondo propio (pájaros, viento, lluvia, fuego…).
     setSong() cambia de tema al acabar el compás, bajando y subiendo el volumen para que no corte. */
  startMusic() {
    this.musicWanted = true;
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextT = this.ctx.currentTime + 0.1; this.step = 0;
    this.echoD.delayTime.value = (60 / SONGS[this.songId].bpm) * 0.75;
    this.musicTimer = window.setInterval(() => this.schedule(), 40);
  }
  stopMusic() {
    this.musicWanted = false;
    if (this.musicTimer !== null) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
  /** Tema que suena: 'menu', una zona ('reino', 'glaciar', 'ciudad', 'infierno') o 'boss'. */
  setSong(id: string) {
    if (!SONGS[id] || id === this.wantSong) return;
    this.wantSong = id;
  }
  get song() { return this.songId; }
  private schedule() {
    if (!this.ctx) return;
    while (this.nextT < this.ctx.currentTime + 0.2) {
      const s = this.step % 16;
      if (s === 0 && this.wantSong !== this.songId) {
        this.songId = this.wantSong; this.step = 0;
        this.fade(this.nextT - this.ctx.currentTime);
        this.echoD.delayTime.setValueAtTime((60 / SONGS[this.songId].bpm) * 0.75, this.nextT);
      }
      const song = SONGS[this.songId], spb = 60 / (song.bpm + this.intensity * song.push) / 4, barLen = spb * 16;
      const delay = this.nextT - this.ctx.currentTime, bar = Math.floor(this.step / 16) % song.chords.length;
      const [off, q] = song.chords[bar], root = song.root * 2 ** (off / 12);
      const tones = [0, q === 'm' ? 3 : 4, 7, 12].map(n => root * 2 ** (n / 12));
      const at = (p?: string) => (p && p[s] && p[s] !== '.' ? p[s] : '');
      const M = { music: true, delay };
      // colchón: el acorde entero, que entra y sale despacio
      if (s === 0) for (const f of tones) this.tone(f * song.padOct, barLen * 1.15, song.padVol, { ...M, type: song.padWave, attack: barLen * 0.35, cut: song.padCut, detune: 9, rev: 0.7 });
      const b = at(song.bass);
      if (b) { const f = b === 'o' ? root * 2 : b === '5' ? tones[2] : root; this.tone(f, spb * (song.bassLen ?? 2), song.bassVol ?? 0.2, { ...M, type: 'sawtooth', cut: song.bassCut ?? 500, rev: 0.15 }); }
      const n = at(song.lead);
      if (n && (s % 4 === 0 || this.intensity > 0.25 || song.leadAll)) {
        const i = Number(n), f = tones[i % 4] * song.leadOct * (i >= 4 ? 2 : 1);
        this.tone(f, spb * (song.leadLen ?? 3), song.leadVol, { ...M, type: song.leadWave, cut: song.leadCut, rev: 0.5, echo: 0.45 });
      }
      if (at(song.kick)) this.tone(song.kickF ?? 110, 0.35, song.kickVol ?? 0.3, { ...M, f2: 38 });
      if (at(song.snare)) this.noise(0.18, 0.08, 1600, { ...M, type: 'bandpass', rev: 0.4 });
      if (at(song.hat) || (this.intensity > 0.6 && song.hat && s % 2 === 1)) this.noise(0.035, 0.035, 8000, { ...M, type: 'highpass' });
      // fondo de cada zona
      switch (song.bg) {
        case 'birds': if (s % 4 === 0 && Math.random() < 0.18) { const f = 2400 + Math.random() * 1600; for (let k = 0; k < 3; k++) this.tone(f, 0.06, 0.018, { ...M, f2: f * 1.3, delay: delay + k * 0.09, rev: 0.5 }); } break;
        case 'wind': if (s === 0) this.noise(barLen * 1.3, 0.05, 500 + Math.random() * 300, { ...M, type: 'bandpass', f2: 900 + Math.random() * 500, q: 3, attack: barLen * 0.5, rev: 0.5 }); break;
        case 'rain': if (s === 0) this.noise(barLen * 1.2, 0.03, 3500, { ...M, type: 'bandpass', q: 0.4, attack: 0.3 }); if (Math.random() < 0.25) this.tone(2000 + Math.random() * 2000, 0.03, 0.01, { ...M }); break;
        case 'fire': if (s % 4 === 0) this.crackle(2 + ((Math.random() * 3) | 0), spb * 4, 0.05, delay, true); if (s === 0) this.noise(barLen * 1.2, 0.04, 160, { ...M, attack: 0.5 }); break;
        case 'drone': if (s === 0) this.tone(root / 2, barLen * 1.1, 0.06, { ...M, type: 'sawtooth', cut: 220, attack: 0.4 }); break;
      }
      this.step++; this.nextT += spb;
    }
  }
  private fade(at: number) {
    if (!this.ctx) return;
    const g = this.musicG.gain, now = this.ctx.currentTime, v = this.musicOn ? this.musicVol * 0.6 : 0;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(v * 0.2, now + Math.max(0.05, at));
    g.linearRampToValueAtTime(v, now + Math.max(0.05, at) + 1.5);
  }
}
export const audio = new AudioSystem();

/** Un tema: 4 acordes (semitonos sobre root, mayor o menor) y patrones de 16 pasos. */
export interface Song {
  bpm: number; push: number; root: number; chords: [number, 'M' | 'm'][];
  padWave: OscillatorType; padVol: number; padCut: number; padOct: number;
  lead: string; leadWave: OscillatorType; leadVol: number; leadOct: number; leadCut?: number; leadLen?: number; leadAll?: boolean;
  bass?: string; bassVol?: number; bassCut?: number; bassLen?: number;
  kick?: string; snare?: string; hat?: string; kickF?: number; kickVol?: number;
  /** Sonido de fondo de la zona. */
  bg?: 'birds' | 'wind' | 'rain' | 'fire' | 'drone';
}
// patrones: 0-3 nota del acorde (4-7 una octava más arriba), x golpe, o octava del bajo, 5 quinta, . silencio
export const SONGS: Record<string, Song> = {
  // menú: misterioso y tranquilo, solo colchón y unas notas con eco
  menu: { bpm: 80, push: 0, root: 110, chords: [[0, 'm'], [-4, 'M'], [3, 'M'], [-2, 'M']],
    padWave: 'sawtooth', padVol: 0.03, padCut: 900, padOct: 1,
    lead: '0.......2...1...', leadWave: 'triangle', leadVol: 0.05, leadOct: 4, leadAll: true, bg: 'drone' },
  // Reino: cálido y de aventura, arpa con eco, pájaros y un pulso suave
  reino: { bpm: 96, push: 14, root: 130.8, chords: [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M']],
    padWave: 'triangle', padVol: 0.04, padCut: 1600, padOct: 1,
    lead: '0.1.2.4.2.1.3.1.', leadWave: 'triangle', leadVol: 0.05, leadOct: 2, leadLen: 2.5,
    bass: 'x.......5.......', bassVol: 0.14, bassCut: 400, bassLen: 6,
    kick: 'x.......x.......', kickVol: 0.16, bg: 'birds' },
  // Glaciar: lento y helado, campanas lejanas y viento
  glaciar: { bpm: 70, push: 10, root: 146.8, chords: [[0, 'm'], [-2, 'M'], [3, 'M'], [-2, 'M']],
    padWave: 'sine', padVol: 0.05, padCut: 2400, padOct: 1,
    lead: '4.....2.....6...', leadWave: 'sine', leadVol: 0.05, leadOct: 4, leadLen: 8, leadAll: true, bg: 'wind' },
  // Ciudad: noche con lluvia, synth suave, bajo y ritmo tranquilo
  ciudad: { bpm: 100, push: 14, root: 110, chords: [[0, 'm'], [-4, 'M'], [3, 'M'], [-2, 'M']],
    padWave: 'sawtooth', padVol: 0.03, padCut: 1000, padOct: 1,
    lead: '0.2.1.3.0.2.4.3.', leadWave: 'square', leadVol: 0.025, leadOct: 2, leadCut: 1800, leadLen: 1.5,
    bass: 'x...x...x...x.o.', bassVol: 0.16, bassCut: 450, bassLen: 3,
    kick: 'x.......x.......', snare: '....x.......x...', hat: '..x...x...x...x.', kickVol: 0.2, bg: 'rain' },
  // Infierno: oscuro y pesado, tambores graves, zumbido y fuego que chisporrotea
  infierno: { bpm: 84, push: 16, root: 82.4, chords: [[0, 'm'], [1, 'M'], [0, 'm'], [-2, 'M']],
    padWave: 'sawtooth', padVol: 0.035, padCut: 650, padOct: 1,
    lead: '0.......1.......', leadWave: 'sawtooth', leadVol: 0.03, leadOct: 2, leadCut: 900, leadLen: 6,
    bass: 'x.....x.........', bassVol: 0.18, bassCut: 300, bassLen: 5,
    kick: 'x..x......x..x..', kickF: 75, kickVol: 0.35, snare: '........x.......', bg: 'fire' },
  // jefe: tenso y con prisa, bajo que pulsa y tambores
  boss: { bpm: 128, push: 8, root: 65.4, chords: [[0, 'm'], [-4, 'M'], [-2, 'M'], [-1, 'M']],
    padWave: 'sawtooth', padVol: 0.035, padCut: 1200, padOct: 2,
    lead: '0.1.2.1.0.1.3.1.', leadWave: 'square', leadVol: 0.025, leadOct: 4, leadCut: 2200, leadLen: 1.2, leadAll: true,
    bass: 'xoxoxoxoxoxoxoxo', bassVol: 0.16, bassCut: 600, bassLen: 0.9,
    kick: 'x...x...x...x...', snare: '....x.......x.x.', hat: 'x.x.x.x.x.x.x.x.', kickF: 95, kickVol: 0.32, bg: 'drone' },
};
