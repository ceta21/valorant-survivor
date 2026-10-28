// Cuentas de jugador (Supabase Auth) y progreso guardado en la tabla `profiles`.
// El jugador solo elige nombre y contraseña: internamente se usa un email derivado del nombre
// (no se envían correos; en Supabase debe estar desactivado "Confirm email").
import { supabase } from './supabase';
import { SaveData, normalizeSave } from './storage';

export interface Account { uid: string; username: string; playerId: number }
export const accountsEnabled = Boolean(supabase);

const EMAIL_DOMAIN = 'players.valorant-survivor.vercel.app';
const emailFor = (username: string) => `${username.toLowerCase()}@${EMAIL_DOMAIN}`;
export const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;

/** Traduce los errores de Supabase a mensajes para el jugador. */
function friendly(err: unknown): Error {
  const m = String((err as any)?.message ?? err);
  if (/invalid login credentials/i.test(m)) return new Error('Usuario o contraseña incorrectos');
  if (/already registered|already exists|duplicate/i.test(m)) return new Error('Ese nombre de usuario ya existe');
  if (/password/i.test(m) && /least|short|weak/i.test(m)) return new Error('La contraseña debe tener al menos 6 caracteres');
  if (/email not confirmed/i.test(m)) return new Error('La cuenta no está confirmada (desactiva "Confirm email" en Supabase)');
  if (/rate limit|too many/i.test(m)) return new Error('Demasiados intentos. Espera un momento y vuelve a probar');
  if (/fetch|network/i.test(m)) return new Error('Sin conexión con el servidor');
  return new Error(m);
}

async function loadProfile(uid: string): Promise<{ account: Account; save: SaveData }> {
  const { data, error } = await supabase!.from('profiles').select('username, player_id, save').eq('id', uid).single();
  if (error) throw friendly(error);
  return { account: { uid, username: data.username, playerId: data.player_id }, save: normalizeSave(data.save) };
}

/** Sesión guardada en este navegador (si el jugador no cerró sesión). */
export async function restoreSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  try { return await loadProfile(data.session.user.id); } catch { return null; }
}

export async function signIn(username: string, password: string) {
  if (!supabase) throw new Error('Las cuentas no están disponibles');
  const { data, error } = await supabase.auth.signInWithPassword({ email: emailFor(username.trim()), password });
  if (error) throw friendly(error);
  return loadProfile(data.user.id);
}

/** Crea la cuenta. initial = progreso con el que empieza (el de la sesión de invitado). */
export async function signUp(username: string, password: string, initial: SaveData) {
  if (!supabase) throw new Error('Las cuentas no están disponibles');
  const name = username.trim();
  if (!USERNAME_RE.test(name)) throw new Error('El nombre debe tener de 3 a 16 letras, números o _');
  if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
  const free = await supabase.rpc('username_available', { name });
  if (free.error) throw friendly(free.error);
  if (free.data === false) throw new Error('Ese nombre de usuario ya existe');
  const { data, error } = await supabase.auth.signUp({ email: emailFor(name), password, options: { data: { username: name } } });
  if (error) throw friendly(error);
  if (!data.session) throw new Error('Cuenta creada, pero falta desactivar "Confirm email" en Supabase para poder entrar');
  // el progreso inicial va a la tabla (no a los metadatos, que viajan en cada token)
  const up = await supabase.from('profiles').update({ save: initial, updated_at: new Date().toISOString() }).eq('id', data.user!.id);
  if (up.error) throw friendly(up.error);
  return loadProfile(data.user!.id);
}

export async function signOut() {
  await flushProgress();
  await supabase?.auth.signOut();
}

/* ------------------------------------------------------------------ guardado en la nube */
let pending: SaveData | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

async function push() {
  if (!supabase || !pending) return;
  const save = pending; pending = null;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await supabase.from('profiles').update({ save, updated_at: new Date().toISOString() }).eq('id', data.session.user.id);
  if (error && !pending) pending = save;   // se reintentará en el próximo guardado
}

/** Guarda el progreso (agrupando cambios seguidos en un solo envío). */
export function saveProgress(save: SaveData, now = false) {
  pending = save;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; push(); }, now ? 0 : 1500);
}

/** Envía ya lo pendiente (antes de cerrar sesión o la página). */
export async function flushProgress() {
  if (timer) { clearTimeout(timer); timer = null; }
  await push();
}
