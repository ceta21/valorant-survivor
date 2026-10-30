// Genera docs/10-datos-del-juego.md con las tablas de datos sacadas directamente del código
// (agentes, habilidades, armas, enemigos, mejoras, dificultades, misiones…).
// Se ejecuta con `npm run docs:data` cada vez que cambian los datos del juego.
import { writeFileSync, mkdirSync } from 'node:fs';
import { AGENTS, EXCLUSIVE_AGENTS, ULTIMATES, ABILITIES } from '../src/data/agents';
import { POWERS, HERO_POWER } from '../src/data/powers';
import { ENEMIES, SPAWNABLE, BOSS_SCHEDULE, WAVE_TIMES, FINAL_TIME, ENDLESS_BOSS_START, ENDLESS_BOSS_MIN, ENDLESS_BOSSES, ENDLESS_MAX_BOSSES } from '../src/data/enemies';
import { MAPS } from '../src/data/maps';
import { DIFFICULTIES } from '../src/data/difficulty';
import { MISSIONS, ACHIEVEMENTS } from '../src/data/goals';
import { META, metaCost } from '../src/data/meta';
import { UPGRADES } from '../src/data/upgrades';
import { MARKET_SLOTS, MARKET_PERIOD_MS } from '../src/data/market';
import { NEWS } from '../src/data/news';
import { DEFAULT_KEYS, ACTIONS } from '../src/game/controls';
import { RARITY_NAMES } from '../src/game/types';
import type { AbilityDef } from '../src/game/types';

const esc = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|');
const table = (head: string[], rows: unknown[][]) =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.map(esc).join(' | ')} |`)].join('\n');
const mods = (m: Record<string, number | undefined>) => Object.entries(m).map(([k, v]) => `${k} ${v! > 0 ? '+' : ''}${v}`).join(', ');
const ab = (a?: AbilityDef) => (a ? `${a.name} (\`${a.id}\`, ${a.kind}${a.cd ? `, ${a.cd} s` : ''})` : '—');
const abParams = (a: AbilityDef) => Object.entries(a).filter(([k]) => !['id', 'name', 'desc', 'kind', 'cd', 'color', 'fx'].includes(k)).map(([k, v]) => `${k}=${v}`).join(', ');

const out: string[] = [];
out.push(`# 10 · Datos del juego (generado)

> **No editar a mano.** Este fichero lo genera \`scripts/docs-data.ts\` a partir del código
> (\`npm run docs:data\`). Si cambias algún dato del juego, vuelve a generarlo.
>
> Última generación: ${new Date().toISOString().slice(0, 10)} · versión de Novedades: v${NEWS[0]?.id ?? '?'}
`);

out.push(`## Agentes base\n`);
out.push(table(['id', 'Nombre', 'Rol', 'Vida', 'Velocidad', 'Daño', 'Coste', 'Rasgo', 'Modificadores'],
  AGENTS.map(a => [`\`${a.id}\``, a.name, a.role, a.hp, a.speed, a.damage, a.cost || 'gratis', a.trait.label, mods(a.trait.mods)])));
out.push(`\nLos agentes con coste 0 (Jett, Phoenix, Sage) están desbloqueados desde el principio.\n`);

out.push(`## Habilidades por agente\n`);
out.push(table(['Agente', 'Espacio (especial)', 'E (secundaria)', 'Q (definitiva)'], AGENTS.map(a => [a.name, ab(a.special), ab(a.secondary), ab(a.ultimate)])));
out.push(`\n### Parámetros de cada habilidad\n`);
out.push(table(['id', 'Nombre', 'Tipo', 'Recarga', 'Efecto visual', 'Parámetros', 'Descripción'],
  [...ABILITIES, ...ULTIMATES].map(a => [`\`${a.id}\``, a.name, a.kind, a.cd ? `${a.cd} s` : 'carga de definitiva', a.fx ?? '—', abParams(a), a.desc])));

out.push(`\n## Agentes exclusivos (mercado nocturno)\n`);
out.push(table(['id', 'Nombre', 'Rol', 'Vida', 'Velocidad', 'Daño', 'Precio base', 'Rasgo', 'Kit por defecto'],
  EXCLUSIVE_AGENTS.map(a => [`\`${a.id}\``, a.name, a.role, a.hp, a.speed, a.damage, a.cost, `${a.trait.label}: ${mods(a.trait.mods)}`, `${a.special.id} / ${a.secondary?.id} / ${a.ultimate.id}`])));

out.push(`\n## Poderes\n`);
out.push(table(['id', 'Nombre', 'Rareza', 'Daño', 'Recarga (s)', 'Proyectiles', 'Perfora', 'Alcance', 'Crítico', 'Extra', 'Evolución (Nv 5)', 'Héroes que empiezan con él'],
  Object.values(POWERS).map(w => [`\`${w.id}\``, `${w.icon} ${w.name}`, RARITY_NAMES[w.rare], w.damage, w.cooldown, w.count, w.pierce, w.range, w.crit,
    [w.burn ? `quema ${w.burn}/s` : '', w.chain ? 'encadena' : '', w.homing ? 'persigue' : '', w.explode ? `explota ${w.explode}` : ''].filter(Boolean).join(', ') || '—',
    `${w.evolved.name}: ${w.evolved.desc}`, Object.keys(HERO_POWER).filter(h => HERO_POWER[h] === w.id).join(', ')])));
out.push('');

out.push(`## Enemigos\n`);
out.push(table(['id', 'Nombre', 'Comportamiento', 'Vida', 'Velocidad', 'Daño', 'Radio', 'XP', 'Desde (s)', 'Peso', 'Patrones'],
  Object.values(ENEMIES).map(e => [`\`${e.id}\``, e.name, e.behavior, e.hp, e.speed, e.dmg, e.r, e.xp, e.minTime, e.weight, e.patterns?.join(', ') ?? '—'])));
out.push(`\nAparecen de forma normal: ${SPAWNABLE.map(s => `\`${s}\``).join(', ')}. Los élites salen por calendario (desde el segundo 200).\n`);

out.push(`## Calendario de la partida\n`);
out.push(table(['Segundo', 'Evento'], [
  ...WAVE_TIMES.map(t => [t, 'Oleada intensa (anillo de enemigos alrededor del jugador)']),
  ...BOSS_SCHEDULE.map(b => [b.time, `Jefe: ${ENEMIES[b.id].name}`]),
].sort((a, b) => (a[0] as number) - (b[0] as number))));
out.push(`\n- Jefe final a los ${FINAL_TIME} s; desde ahí empieza el **modo infinito**.
- Modo infinito: jefes al azar entre ${ENDLESS_BOSSES.join(', ')}; el primero a los ${FINAL_TIME} + ${ENDLESS_BOSS_START} × dificultad s; el intervalo baja de ${ENDLESS_BOSS_START} s hasta un mínimo de ${ENDLESS_BOSS_MIN} s (× multiplicador de la dificultad); máximo ${ENDLESS_MAX_BOSSES} jefes vivos.
`);

out.push(`## Dificultades\n`);
out.push(table(['id', 'Nombre', 'Vida enemigos', 'Daño enemigos', 'Aparición', 'Intervalo de jefes', 'Créditos', 'Descripción'],
  DIFFICULTIES.map(d => [`\`${d.id}\``, d.name, `×${d.hp}`, `×${d.dmg}`, `×${d.spawn}`, `×${d.bossEvery}`, `×${d.credits}`, d.desc])));

out.push(`\n## Mejoras de partida (al subir de nivel)\n`);
out.push(table(['id', 'Nombre', 'Común', 'Poco común', 'Épica', 'Legendaria', 'Peso', 'Máx.', 'Efecto (valor legendario)'],
  UPGRADES.map(u => [`\`${u.id}\``, u.name, ...u.v.map(v => v || '—'), u.weight, u.max ?? '∞', u.text(u.v[3])])));

out.push(`\n## Mejoras permanentes\n`);
out.push(table(['id', 'Nombre', 'Por nivel', 'Máx.', 'Descripción'], META.map(m => [`\`${m.id}\``, m.name, `+${Math.round(m.per * 100)}%`, m.max, m.desc])));
out.push(`\nCoste del nivel siguiente: \`round(80 × (nivel + 1)^1.6)\` → ${Array.from({ length: 10 }, (_, i) => metaCost(i)).join(', ')}.\n`);

out.push(`## Misiones y logros\n`);
out.push(table(['Tipo', 'id', 'Nombre', 'Condición', 'Recompensa'],
  [...MISSIONS.map(m => ['Misión', `\`${m.id}\``, m.name, m.desc, `◈ ${m.reward}`]), ...ACHIEVEMENTS.map(a => ['Logro', `\`${a.id}\``, a.name, a.desc, '—'])]));

out.push(`\n## Mapas\n`);
out.push(table(['id', 'Nombre', 'Descripción'], MAPS.map(m => [`\`${m.id}\``, m.name, m.desc])));

out.push(`\n## Mercado nocturno\n`);
out.push(`- ${MARKET_SLOTS} cartas por jugador, nueva rotación cada ${MARKET_PERIOD_MS / 3600000} h (medianoche UTC).
- Son los agentes exclusivos, en orden al azar.
- Descuento aleatorio del 10 % al 35 %; el precio se redondea a múltiplos de 50.
`);

out.push(`## Controles por defecto\n`);
out.push(table(['Acción', 'Tecla'], ACTIONS.map(a => [a.label, `\`${DEFAULT_KEYS[a.id]}\``])));
out.push(`\nSiempre activas además: flechas (mover), Esc (pausa), 1/2/3 (elegir mejora).\n`);

out.push(`## Historial de versiones (Novedades)\n`);
out.push(table(['Versión', 'Fecha', 'Título', 'Tipo'], NEWS.map(n => [`v${n.id}`, n.date, n.title, n.tag])));

mkdirSync('docs', { recursive: true });
writeFileSync('docs/10-datos-del-juego.md', out.join('\n') + '\n');
console.log('docs/10-datos-del-juego.md generado');
