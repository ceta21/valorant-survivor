// Prueba del mando con un Gamepad simulado: mueve al héroe, lanza habilidades, pausa, y fuera de la partida deja
// la navegación de menús. Uso: npm run test:gamepad
import { GameEngine } from '../src/game/GameEngine';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAP_BY_ID } from '../src/data/maps';

let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
const gp: any = { connected: true, axes: [0, 0, 0, 0], buttons };
let pads: any[] = [gp];
Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => pads }, configurable: true });
(globalThis as any).window = { addEventListener() {}, removeEventListener() {} };
const { Input } = await import('../src/game/Input');
const pad = await import('../src/utils/gamepad');

const noop = { onLevelUp() {}, onEnd() {}, sfx() {} }, meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };
const e: any = new GameEngine(AGENT_BY_ID.ember, MAP_BY_ID.reino, meta, noop as any);
const casts: string[] = []; let paused = 0, maps = 0;
const input = new Input(e, () => paused++, s => casts.push(s), undefined, () => maps++);

gp.axes = [0.1, -0.1, 0, 0]; input.poll();
ok(e.inputMove.x === 0 && e.inputMove.y === 0, 'el stick casi en el centro no mueve (zona muerta)');
gp.axes = [1, 0, 0, 0]; input.poll();
ok(e.inputMove.x === 1 && e.inputMove.y === 0, 'stick a la derecha: se mueve a la derecha');
gp.axes = [0, 0, 0, 0]; buttons[pad.PAD.UP].pressed = true; buttons[pad.PAD.LEFT].pressed = true; input.poll();
ok(Math.abs(e.inputMove.x + Math.SQRT1_2) < 1e-9 && Math.abs(e.inputMove.y + Math.SQRT1_2) < 1e-9, 'cruceta arriba-izquierda: diagonal');
buttons[pad.PAD.UP].pressed = buttons[pad.PAD.LEFT].pressed = false;
const press = (b: number) => { buttons[b].pressed = true; input.poll(); input.poll(); buttons[b].pressed = false; input.poll(); };
press(pad.PAD.A); press(pad.PAD.X); press(pad.PAD.Y); press(pad.PAD.RB);
ok(casts.join() === 'special,secondary,ultimate,special', `A, X, Y y RB lanzan habilidades, una vez por pulsación (${casts.join(', ')})`);
press(pad.PAD.START); press(pad.PAD.SELECT);
ok(paused === 1 && maps === 1, 'Start pausa y Select abre el mapa');
e.state = 'paused'; casts.length = 0; press(pad.PAD.A); gp.axes = [1, 0, 0, 0]; e.inputMove.x = 0; input.poll();
ok(casts.length === 0 && e.inputMove.x === 0, 'en pausa el mando no mueve ni lanza (lo usa la navegación de menús)');
gp.connected = false; pads = [null];
e.state = 'playing'; input.poll();
ok(e.inputMove.x === 0, 'sin mando conectado no pasa nada');
input.destroy();

if (fails) { console.error(`\n${fails} fallo(s)`); process.exit(1); }
console.log('\nTodo correcto');
