// Prueba de las evoluciones combinadas: un poder al nivel 5 solo evoluciona si además se tiene su mejora de partida.
// Uso: npm run test:evo
import { GameEngine } from '../src/game/GameEngine';
import { AGENT_BY_ID } from '../src/data/agents';
import { MAP_BY_ID } from '../src/data/maps';
import { POWERS, EVO_LEVEL, MAX_LEVEL } from '../src/data/powers';
import { UPGRADE_BY_ID } from '../src/data/upgrades';
let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
const noop = { onLevelUp() {}, onEnd() {}, sfx() {} }, meta = { dmg: 0, hp: 0, speed: 0, xp: 0 };
const mk = () => new GameEngine(AGENT_BY_ID.ember, MAP_BY_ID.reino, meta, noop);   // Ember empieza con Bola de fuego
const roll = (e: GameEngine, n = 300) => Array.from({ length: n }, () => (e as any).rollChoices()).flat();

ok(Object.values(POWERS).every(p => UPGRADE_BY_ID[p.evoWith]), 'cada poder tiene una mejora de partida que existe para evolucionar');
{
  const e = mk(), w = e.weapons[0];
  ok(w.id === 'fuego', 'Ember empieza con Bola de fuego (evoluciona con «' + UPGRADE_BY_ID[POWERS.fuego.evoWith].name + '»)');
  w.lvl = MAX_LEVEL;
  let cards = roll(e);
  ok(!cards.some(c => c.kind === 'power-evo') && !cards.some(c => c.kind === 'power-up' && c.powerId === 'fuego'), 'al nivel 5 sin la mejora no sale ni subida ni evolución');
  const hint = cards.find(c => c.kind === 'stat' && c.id === POWERS.fuego.evoWith);
  ok(!!hint && hint.evoFor === 'fuego', 'la carta de la mejora necesaria avisa de que hace evolucionar el poder');
  e.taken[POWERS.fuego.evoWith] = 1;
  cards = roll(e, 50);
  const share = cards.filter(c => c.kind === 'power-evo').length / 50;
  ok(share === 1, `con la mejora, la carta de evolución sale siempre (${Math.round(share * 100)}% de las tiradas)`);
  // elegirla: nivel de evolución y más daño
  const before = (e as any).weaponCd(w), dmgBefore = POWERS.fuego.damage * (1 + 0.22 * (MAX_LEVEL - 1));
  e.state = 'levelup'; (e.me as any).pending = 1; e.me.choices = [cards.find(c => c.kind === 'power-evo')!];
  e.chooseUpgrade(0);
  ok(w.lvl === EVO_LEVEL, 'al elegirla el poder pasa a su versión evolucionada');
  ok((e as any).weaponCd(w) <= before && dmgBefore * (POWERS.fuego.evolved.dmgMul ?? 1) >= dmgBefore, 'la evolución mantiene la recarga y suma su mejora');
  cards = roll(e, 100);
  ok(!cards.some(c => c.powerId === 'fuego'), 'un poder evolucionado ya no sale en las cartas');
}
{
  // otros poderes siguen subiendo con normalidad hasta el 5
  const e = mk(); const w = e.weapons[0]; w.lvl = 3;
  const up = roll(e).find(c => c.kind === 'power-up' && c.powerId === 'fuego');
  ok(!!up && up.value === 4, 'por debajo del máximo sale la subida de nivel normal');
}
console.log(fails ? `\n${fails} FALLOS` : '\nTodo correcto'); process.exit(fails ? 1 : 0);
