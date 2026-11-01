// Prueba de las estadísticas anónimas: se envían agrupadas, sin datos personales, con un mismo identificador de
// visita, y nada si el jugador las desactiva. Uso: npm run test:analytics
import { flush, setAnalytics, setSender, track } from '../src/utils/analytics';
import { defaultSave, normalizeSave } from '../src/utils/storage';

let fails = 0; const ok = (c: boolean, msg: string) => { console.log((c ? 'OK   ' : 'FALLO'), msg); if (!c) fails++; };
const sent: any[][] = [];
setSender(async rows => { sent.push(rows); });

ok(defaultSave().settings.analytics === true, 'vienen activadas por defecto');
ok(normalizeSave({ settings: { musicVol: 0.4 } } as any).settings.analytics === true, 'los guardados antiguos las reciben activadas');

track('open', { device: 'pc', lang: 'es', nuevo: true, cuenta: false });
track('run_start', { hero: 'ember', map: 'reino' });
track('run_end', { hero: 'ember', time: 95, quit: true });
ok(sent.length === 0, 'no se envía al momento: se agrupan');
flush();
ok(sent.length === 1 && sent[0].length === 3, `se envían juntos (${sent[0]?.length ?? 0} eventos en 1 envío)`);
const rows = sent[0] ?? [];
ok(rows.every(r => r.session === rows[0].session) && /^[0-9a-z-]{8,40}$/.test(rows[0].session), 'llevan el mismo identificador de visita, al azar');
const text = JSON.stringify(rows);
ok(!/name|username|email|ip|uid|player/i.test(text), 'no llevan nombre, cuenta, correo ni IP');
ok(rows.map(r => r.kind).join() === 'open,run_start,run_end', 'tipos de evento correctos');

setAnalytics(false);
track('run_start', { hero: 'lyra' });
flush();
ok(sent.length === 1, 'desactivadas, no se envía nada');
setAnalytics(true);
track('tutorial', { step: 'move', skipped: true }); flush();
ok(sent.length === 2 && sent[1][0].kind === 'tutorial', 'al reactivarlas vuelven a enviarse');

if (fails) { console.error(`\n${fails} fallo(s)`); process.exit(1); }
console.log('\nTodo correcto');
