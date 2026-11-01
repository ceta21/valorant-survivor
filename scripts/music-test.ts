// Prueba del audio: cada zona tiene su tema bien escrito, la partida pide el de la zona o el del jefe, y cada
// elemento (rayo, fuego, hielo…) y cada proyectil tiene un sonido propio. Usa un WebAudio simulado que apunta qué
// nodos se crean. Uso: npm run test:music
import { MAPS, MAP_BY_ID } from '../src/data/maps';
import { POWER_LIST } from '../src/data/powers';
import { AGENTS } from '../src/data/agents';
import { GameEngine } from '../src/game/GameEngine';
import { AGENT_BY_ID } from '../src/data/agents';

let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };

/* ---------- WebAudio simulado: guarda una "firma" de lo que crea cada sonido */
let log: string[] = [];
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {} });
const node = (kind: string) => {
  const n: any = { connect() {}, start() {}, stop() {}, gain: param(), frequency: param(), detune: param(), Q: param(), delayTime: param(), threshold: param(), ratio: param() };
  let t = '';
  Object.defineProperty(n, 'type', { set(v) { t = v; log.push(`${kind}:${v}`); }, get: () => t });
  log.push(kind);
  return n;
};
class FakeCtx {
  currentTime = 0; sampleRate = 8000; state = 'running'; destination = node('dest');
  createGain() { return node('gain'); } createOscillator() { return node('osc'); } createBiquadFilter() { return node('filter'); }
  createBufferSource() { return node('noise'); } createConvolver() { return node('conv'); } createDelay() { return node('delay'); }
  createDynamicsCompressor() { return node('comp'); }
  createBuffer(ch: number, n: number) { return { getChannelData: () => new Float32Array(n) }; }
  resume() {}
}
(globalThis as any).window = { AudioContext: FakeCtx, setInterval: () => 1 };
const { audio, SONGS } = await import('../src/utils/audio');
audio.unlock();
const sig = (name: string) => { log = []; audio.play(name); return log.join(' '); };

/* ---------- efectos */
const fxs = [...new Set(AGENTS.flatMap(a => [a.special, a.secondary, a.ultimate].map(ab => ab?.fx ?? '')))];
const silent = fxs.filter(fx => sig('ab_' + fx).length < 20);
ok(silent.length === 0, `todas las habilidades suenan (${fxs.length} efectos${silent.length ? ', sin sonido: ' + silent.join(', ') : ''})`);
const thunder = sig('ab_electric'), fire = sig('ab_fire'), ice = sig('ab_ice');
ok(new Set([thunder, fire, ice, sig('ab_water'), sig('ab_wind'), sig('ab_holy'), sig('ab_shadow')]).size === 7, 'rayo, fuego, hielo, agua, viento, luz y sombra suenan distinto');
ok(thunder.includes('filter:highpass') && thunder.includes('osc:sawtooth'), 'el rayo cruje (chasquido agudo y zumbido eléctrico) y retumba');
ok(fire.split('filter:highpass').length > 6 && fire.includes('filter:bandpass'), 'el fuego sopla y chisporrotea');
ok(sig('ult_electric').length > thunder.length, 'la definitiva suena más grande que la habilidad');
const looks = [...new Set(POWER_LIST.map(p => p.look ?? ''))];
ok(new Set(looks.map(l => sig('shot_' + l))).size === looks.length, `cada proyectil suena distinto (${looks.join(', ')})`);
for (const n of ['thunder', 'fire_breath', 'web', 'shield', 'blink', 'boss', 'explosion', 'hit', 'kill', 'levelup', 'win', 'lose'])
  ok(sig(n).length > 10, `suena «${n}»`);

/* ---------- música */
for (const id of ['menu', 'boss', ...MAPS.map(m => m.id)]) ok(!!SONGS[id], `hay tema para «${id}»`);
for (const [id, s] of Object.entries(SONGS)) {
  const pats = { lead: s.lead, bass: s.bass, kick: s.kick, snare: s.snare, hat: s.hat };
  const bad = Object.entries(pats).filter(([k, p]) => p !== undefined && (p.length !== 16 || !(k === 'bass' ? /^[xo5.]+$/ : k === 'lead' ? /^[0-7.]+$/ : /^[x.]+$/).test(p)));
  ok(bad.length === 0 && s.chords.length === 4 && s.bpm >= 60 && s.bpm <= 150, `tema «${id}» bien escrito (${s.bpm} ppm, fondo: ${s.bg ?? 'ninguno'}${bad.length ? ', mal: ' + bad.map(b => b[0]).join(', ') : ''})`);
}
// tocar cada tema 8 compases con el reloj simulado: no debe fallar y debe crear notas
for (const id of Object.keys(SONGS)) {
  const a: any = audio; a.startMusic(); a.setSong(id); log = [];
  let err = '';
  try { for (let i = 0; i < 400; i++) { a.ctx.currentTime += 0.1; a.schedule(); } } catch (x) { err = String(x); }
  ok(!err && a.song === id && log.length > 200, `el tema «${id}» suena sin errores (${log.length} nodos${err ? ', ' + err : ''})`);
}
ok(new Set(MAPS.map(m => SONGS[m.id].bg)).size === MAPS.length, 'cada zona tiene su propio sonido de fondo');
ok(SONGS.boss.bpm > Math.max(...MAPS.map(m => SONGS[m.id].bpm)), 'el tema del jefe es el más rápido');

const noop = { onLevelUp() {}, onEnd() {}, sfx() {} }, meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };
for (const m of MAPS) {
  const e: any = new GameEngine(AGENT_BY_ID.ember, MAP_BY_ID[m.id], meta, noop as any);
  ok(e.musicTheme() === m.id, `empezando en ${m.name} suena su tema («${e.musicTheme()}»)`);
}
const e: any = new GameEngine(AGENT_BY_ID.ember, MAP_BY_ID.reino, meta, noop as any);
const b = e.spawnEnemy('zona', e.me.body.x + 300, e.me.body.y);
ok(e.musicTheme() === 'boss', 'con un jefe vivo suena el tema del jefe');
e.killEnemy(b, false);
ok(e.musicTheme() === 'reino', 'al derrotarlo vuelve el de la zona');

if (fails) { console.error(`\n${fails} fallo(s)`); process.exit(1); }
console.log('\nTodo correcto');
