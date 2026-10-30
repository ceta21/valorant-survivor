// Mercado nocturno: cada jugador recibe cada día los agentes exclusivos boca abajo, en orden al azar y con
// descuentos distintos (deterministas para su cuenta, así que recargar la página no cambia la tienda).
import { EXCLUSIVE_AGENTS } from './agents';

export const MARKET_PERIOD_MS = 24 * 60 * 60 * 1000;
export const MARKET_SLOTS = EXCLUSIVE_AGENTS.length;

export interface Offer { kind: 'agent'; id: string; base: number; discount: number; price: number }

export const marketPeriod = (now = Date.now()) => Math.floor(now / MARKET_PERIOD_MS);
export const msToNextRotation = (now = Date.now()) => MARKET_PERIOD_MS - (now % MARKET_PERIOD_MS);

function rng(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

/** Ofertas del día para un jugador (seed = id de cuenta, o una semilla de sesión para invitados). */
export function marketOffers(seed: string, period = marketPeriod()): Offer[] {
  const r = rng(`${seed}:${period}`);
  const pool = [...EXCLUSIVE_AGENTS];
  const out: Offer[] = [];
  while (pool.length) {
    const a = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const discount = 10 + Math.floor(r() * 26);            // 10 % – 35 %
    out.push({ kind: 'agent', id: a.id, base: a.cost, discount, price: Math.round((a.cost * (100 - discount)) / 100 / 50) * 50 });
  }
  return out;
}
