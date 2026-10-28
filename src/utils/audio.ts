// Audio 100% sintetizado con WebAudio: no depende de archivos externos.
type Ctx = AudioContext;

class AudioSystem {
  private ctx: Ctx | null = null;
  private master!: GainNode;
  private sfxG!: GainNode;
  private musicG!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  private nextT = 0;
  private musicWanted = false;
  private intensity = 0;
  sfxOn = true;
  musicOn = true;
  sfxVol = 0.7;
  musicVol = 0.4;

  /** Debe llamarse tras un gesto del usuario (clic / tecla). */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC() as Ctx;
    this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(this.ctx.destination);
    this.sfxG = this.ctx.createGain(); this.sfxG.connect(this.master);
    this.musicG = this.ctx.createGain(); this.musicG.connect(this.master);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
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
    this.musicG.gain.value = this.musicOn ? this.musicVol * 0.5 : 0;
  }
  setIntensity(v: number) { this.intensity = v; }

  private tone(f: number, f2: number, dur: number, vol: number, type: OscillatorType = 'square', delay = 0, dest?: AudioNode) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2 !== f) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest ?? this.sfxG);
    o.start(t); o.stop(t + dur + 0.02);
  }
  private noise(dur: number, vol: number, freq: number, type: BiquadFilterType = 'lowpass', delay = 0, dest?: AudioNode) {
    if (!this.ctx || !this.noiseBuf) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest ?? this.sfxG);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  play(name: string) {
    if (!this.ctx || !this.sfxOn) return;
    switch (name) {
      case 'shoot': this.tone(620, 240, 0.06, 0.07, 'square'); break;
      case 'shoot_heavy': this.tone(260, 60, 0.13, 0.12, 'sawtooth'); this.noise(0.08, 0.1, 2400, 'highpass'); break;
      case 'hit': this.noise(0.035, 0.06, 3000, 'highpass'); break;
      case 'crit': this.tone(900, 1500, 0.07, 0.07, 'triangle'); this.noise(0.04, 0.08, 4000, 'highpass'); break;
      case 'kill': this.tone(300, 640, 0.07, 0.06, 'triangle'); break;
      case 'gem': this.tone(1000 + Math.random() * 300, 1400, 0.04, 0.03, 'sine'); break;
      case 'pick': this.tone(520, 520, 0.08, 0.1, 'sine'); this.tone(780, 780, 0.12, 0.1, 'sine', 0.07); break;
      case 'levelup': [440, 554, 659, 880].forEach((f, i) => this.tone(f, f, 0.16, 0.12, 'triangle', i * 0.07)); break;
      case 'ability': this.tone(220, 900, 0.22, 0.12, 'sawtooth'); this.noise(0.15, 0.08, 1800, 'bandpass'); break;
      case 'ult': this.tone(110, 1200, 0.5, 0.15, 'sawtooth'); this.noise(0.5, 0.14, 900, 'bandpass'); this.tone(80, 40, 0.6, 0.2, 'sine'); break;
      case 'hurt': this.tone(180, 60, 0.16, 0.12, 'sawtooth'); break;
      case 'explosion': this.noise(0.32, 0.22, 500); this.tone(110, 40, 0.25, 0.14, 'sine'); break;
      case 'boss': this.tone(90, 70, 0.9, 0.2, 'sawtooth'); this.tone(135, 100, 0.9, 0.12, 'square'); this.noise(0.6, 0.15, 300); break;
      case 'warn': this.tone(520, 520, 0.09, 0.06, 'square'); break;
      case 'wave': this.tone(196, 196, 0.25, 0.14, 'sawtooth'); this.tone(147, 147, 0.4, 0.14, 'sawtooth', 0.22); break;
      case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, f, 0.3, 0.14, 'triangle', i * 0.11)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => this.tone(f, f * 0.96, 0.4, 0.14, 'sawtooth', i * 0.2)); break;
      case 'click': this.tone(700, 500, 0.04, 0.05, 'square'); break;
      case 'hover': this.tone(1200, 1200, 0.02, 0.025, 'sine'); break;
    }
  }

  /* Música: bajo + arpegio + hi-hat en bucle de 16 pasos (la / fa / sol / mi). */
  startMusic() {
    this.musicWanted = true;
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextT = this.ctx.currentTime + 0.1; this.step = 0;
    this.musicTimer = window.setInterval(() => this.schedule(), 40);
  }
  stopMusic() {
    this.musicWanted = false;
    if (this.musicTimer !== null) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
  private schedule() {
    if (!this.ctx) return;
    const spb = 60 / (112 + this.intensity * 24) / 4;
    const bass = [55, 55, 43.65, 43.65, 49, 49, 41.2, 41.2];
    const arp = [220, 261.6, 329.6, 261.6, 174.6, 220, 261.6, 220, 196, 246.9, 293.7, 246.9, 164.8, 207.7, 246.9, 207.7];
    while (this.nextT < this.ctx.currentTime + 0.18) {
      const t = this.nextT - this.ctx.currentTime, s = this.step % 16;
      const bi = Math.floor(s / 2) % 8;
      if (s % 2 === 0) this.tone(bass[Math.floor(this.step / 16) % 2 === 0 ? bi : (bi + 2) % 8], bass[bi], spb * 1.8, 0.2, 'sawtooth', t, this.musicG);
      if (this.intensity > 0.2 || s % 4 === 0) this.tone(arp[(this.step + (Math.floor(this.step / 32) % 2) * 3) % 16], arp[s], spb * 0.9, 0.05, 'square', t, this.musicG);
      if (s % 4 === 2) this.noise(0.04, 0.07, 7000, 'highpass', t, this.musicG);
      if (s % 8 === 0) this.tone(120, 40, 0.16, 0.35, 'sine', t, this.musicG);
      this.step++; this.nextT += spb;
    }
  }
}
export const audio = new AudioSystem();
