// Prueba de supabase/seguridad.sql en un PostgreSQL de prueba (PGlite, en memoria): guardados tramposos rechazados y
// partidas normales aceptadas. Uso: npm run test:security (antes: npm run sql:seguridad)
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const repo = '';   // se ejecuta desde la raíz del proyecto
const db = new PGlite();
let fails = 0; const ok = (c, m) => { console.log(c ? 'OK   ' : 'FALLO', m); if (!c) fails++; };
await db.exec(`
  create schema auth; create table auth.users (id uuid primary key);
  create role anon; create role authenticated;
  create table public.profiles (id uuid primary key references auth.users (id) on delete cascade, username text not null,
    player_id bigint generated always as identity (start with 10000) unique, save jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now());
`);
await db.exec(readFileSync(repo + 'supabase/seguridad.sql', 'utf8'));
await db.exec(readFileSync(repo + 'supabase/seguridad.sql', 'utf8'));   // se puede repetir
const id = '11111111-1111-1111-1111-111111111111';
await db.query(`insert into auth.users values ($1)`, [id]);
await db.query(`insert into public.profiles (id, username) values ($1, 'gabriel')`, [id]);
const base = { credits: 500, unlocked: ['zephyr', 'lyra', 'kael'], meta: { dmg: 0, hp: 0, speed: 0, xp: 0 }, stats: { games: 1, kills: 100, bestTime: 300 },
  shop: { owned: [], agent: {}, pet: '', power: {} }, gear: { items: [{ uid: 'inicio', id: 'amuleto_fuerza', rarity: 0, lvl: 1 }], equipped: ['inicio'] } };
const save = async s => (await db.query(`update public.profiles set save = $1 where id = $2 returning id`, [JSON.stringify(s), id])).rows.length === 1;
const ago = async sec => db.query(`update public.profiles set budget_at = now() - make_interval(secs => $1) where id = $2`, [sec, id]);
const cur = async () => (await db.query(`select save, credit_budget from public.profiles where id = $1`, [id])).rows[0];
const rej = async () => (await db.query(`select count(*)::int n from public.save_rejections`)).rows[0].n;

ok(await save(base), 'el primer guardado (progreso de invitado normal) se acepta');
ok(!(await save({ ...base, credits: 999999 })), 'poner 999.999 créditos se rechaza');
ok((await cur()).save.credits === 500, '…y el progreso guardado sigue siendo el bueno');
ok(await rej() === 1, '…y queda apuntado en save_rejections');
ok(!(await save({ ...base, unlocked: [...base.unlocked, 'vex', 'sylvan', 'ember', 'brutus', 'frost', 'seraph', 'nox', 'raven', 'talos', 'morgan', 'volt', 'grim', 'aqua', 'zahir', 'draco', 'sora', 'tink', 'nox'], shop: { ...base.shop, owned: ['pet_brasin'] }, meta: { dmg: 10, hp: 10, speed: 10, xp: 10 } })), 'desbloquearlo todo sin pagar se rechaza');
ok(await save({ ...base, credits: 500 - 900, unlocked: [...base.unlocked, 'vex'] }) === false, 'créditos negativos se rechazan');

await save(base);
ok(await save({ ...base, credits: 1500 }), 'ganar 1.000 créditos jugando se acepta');
ok(await save({ ...base, credits: 600, unlocked: [...base.unlocked, 'vex'] }), 'comprar un héroe pagándolo (900) se acepta');
ok(await save({ ...base, credits: 600, unlocked: [...base.unlocked, 'vex'], stats: { ...base.stats, bestTime: 400 } }) === false, 'un récord de tiempo imposible (sin tiempo jugado) se rechaza');
await ago(900);
ok(await save({ ...base, credits: 2600, unlocked: [...base.unlocked, 'vex'], stats: { ...base.stats, games: 2, kills: 1500, bestTime: 900 } }), 'una partida de 15 min con 2.000 créditos y su récord se acepta');
// la hucha: muchos guardados seguidos no dan créditos infinitos
let accepted = 0, c = 2600;
for (let i = 0; i < 20; i++) { c += 5000; if (await save({ ...base, credits: c, unlocked: [...base.unlocked, 'vex'], stats: { ...base.stats, games: 2, kills: 1500, bestTime: 900 } })) accepted++; else c -= 5000; }
ok(accepted <= 6, `muchos guardados seguidos no dan créditos infinitos (${accepted} de 20 aceptados, hasta llenar la hucha)`);
const b = (await cur()).credit_budget;
ok(Number(b) < 5000, `la hucha se ha vaciado (${Math.round(b)})`);
await ago(3600);
ok(await save({ ...base, credits: c + 20000, unlocked: [...base.unlocked, 'vex'], stats: { ...base.stats, games: 3, kills: 1500, bestTime: 900 } }), 'tras una hora se puede volver a ganar (la hucha se rellena)');
// equipo
const g = (await cur()).save;
ok(!(await save({ ...g, gear: { ...g.gear, items: [...g.gear.items, ...Array.from({ length: 60 }, (_, i) => ({ uid: 'x' + i, id: 'amuleto_fuerza', rarity: 3, lvl: 5 }))] } })), 'añadir 60 objetos legendarios de golpe se rechaza');
ok(await save({ ...g, gear: { ...g.gear, items: [...g.gear.items, { uid: 'b1', id: 'amuleto_fuerza', rarity: 2, lvl: 1 }] } }), 'un objeto ganado a un jefe se acepta');
// borrar progreso
ok(await save({ credits: 0, unlocked: ['zephyr', 'lyra', 'kael'], meta: {}, stats: { games: 0, kills: 0, bestTime: 0 }, shop: { owned: [], power: {} }, gear: { items: [] } }), 'borrar el progreso se acepta');
// administrador
await db.query(`update public.profiles set is_admin = true where id = $1`, [id]);
ok(await save({ ...base, credits: 9999999 }), 'una cuenta de administrador no se comprueba');
console.log(fails ? `\n${fails} FALLOS` : '\nTodo correcto'); process.exit(fails ? 1 : 0);
