// Mercado de la Grieta: cada jugador recibe cada día 4 cartas boca abajo con estilos de héroe y mascotas de la Tienda a
// precio rebajado (deterministas para su cuenta, así que recargar la página no cambia la tienda). Lo comprado aquí va
// a la Tienda como si se hubiera comprado allí.
import { AGENT_SKINS, PETS } from './shop';

export const MARKET_PERIOD_MS = 24 * 60 * 60 * 1000;
export const MARKET_SLOTS = 4;

export interface Offer { kind: 'style' | 'pet'; id: string; base: number; discount: number; price: number }

export const marketPeriod = (now = Date.now()) => Math.floor(now / MARKET_PERIOD_MS);
export const msToNextRotation = (now = Date.now()) => MARKET_PERIOD_MS - (now % MARKET_PERIOD_MS);

function rng(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

/** Ofertas del día para un jugador (seed = id de cuenta, o una semilla de sesión para invitados): 2 estilos y 2 mascotas. */
export function marketOffers(seed: string, period = marketPeriod()): Offer[] {
  const r = rng(`${seed}:${period}`);
  const pick = <T,>(arr: T[]) => arr.splice(Math.floor(r() * arr.length), 1)[0];
  const offer = (kind: Offer['kind'], id: string, base: number): Offer => {
    const discount = 15 + Math.floor(r() * 26);            // 15 % – 40 %
    return { kind, id, base, discount, price: Math.round((base * (100 - discount)) / 100 / 50) * 50 };
  };
  const styles = [...AGENT_SKINS], pets = [...PETS], out: Offer[] = [];
  for (let i = 0; i < 2; i++) { const s = pick(styles); out.push(offer('style', s.id, s.price)); }
  for (let i = 0; i < 2; i++) { const p = pick(pets); out.push(offer('pet', p.id, p.price)); }
  // orden al azar para que no se sepa qué hay detrás de cada carta
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
