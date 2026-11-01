// Prueba del ranking del domingo: qué domingo se enseña, cuál se cobra y los premios. Uso: npm run test:sunday
import { MEDALS, SUNDAY_PRIZES, lastFinishedSunday, shownSunday } from '../src/data/sundayRank';

let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
const at = (iso: string) => Date.parse(iso);

const sun = shownSunday(at('2026-11-01T15:00:00Z'));
ok(sun.key === '2026-11-01' && sun.live, 'el domingo se enseña el ranking de hoy, en curso');
ok(sun.start.toISOString() === '2026-11-01T00:00:00.000Z' && sun.end.toISOString() === '2026-11-02T00:00:00.000Z', 'de 00:00 a 24:00 UTC');
ok(shownSunday(at('2026-11-01T00:00:00Z')).key === '2026-11-01' && shownSunday(at('2026-10-31T23:59:59Z')).key === '2026-10-25', 'empieza justo a medianoche UTC');
const wed = shownSunday(at('2026-11-04T10:00:00Z'));
ok(wed.key === '2026-11-01' && !wed.live, 'entre semana se enseña el resultado del último domingo');
ok(lastFinishedSunday(at('2026-11-01T15:00:00Z')).key === '2026-10-25', 'el domingo en curso aún no se cobra: se cobra el anterior');
ok(lastFinishedSunday(at('2026-11-02T00:00:01Z')).key === '2026-11-01', 'desde el lunes 00:00 UTC se cobra el que acaba de terminar');
ok(SUNDAY_PRIZES.length === 3 && SUNDAY_PRIZES[0] > SUNDAY_PRIZES[1] && SUNDAY_PRIZES[1] > SUNDAY_PRIZES[2] && MEDALS.length === 3, `premios ${SUNDAY_PRIZES.join(' / ')}`);

if (fails) { console.error(`\n${fails} fallo(s)`); process.exit(1); }
console.log('\nTodo correcto');
