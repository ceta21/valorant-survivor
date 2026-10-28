// Mercado nocturno: cada jugador recibe cada día 4 ofertas al azar (deterministas para su cuenta,
// así que recargar la página no cambia la tienda) con descuentos sobre precios muy altos.
import { EXCLUSIVE_WEAPONS } from './weapons';
import { EXCLUSIVE_AGENTS } from './agents';

export const MARKET_PERIOD_MS = 24 * 60 * 60 * 1000;
export const MARKET_SLOTS = 4;
/** Probabilidad de que la última carta sea un agente exclusivo en lugar de un arma. */
export const AGENT_CHANCE = 0.35;

export interface Offer { kind: 'weapon' | 'agent'; id: string; base: number; discount: number; price: number }

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
  const pool = [...EXCLUSIVE_WEAPONS];
  const pick = <T,>(arr: T[]) => arr.splice(Math.floor(r() * arr.length), 1)[0];
  const offer = (kind: Offer['kind'], id: string, base: number): Offer => {
    const discount = 10 + Math.floor(r() * 26);            // 10 % – 35 %
    return { kind, id, base, discount, price: Math.round((base * (100 - discount)) / 100 / 50) * 50 };
  };
  const out: Offer[] = [];
  for (let i = 0; i < MARKET_SLOTS - 1; i++) { const w = pick(pool); out.push(offer('weapon', w.id, w.price ?? 10000)); }
  if (r() < AGENT_CHANCE) { const a = EXCLUSIVE_AGENTS[Math.floor(r() * EXCLUSIVE_AGENTS.length)]; out.push(offer('agent', a.id, a.cost)); }
  else { const w = pick(pool); out.push(offer('weapon', w.id, w.price ?? 10000)); }
  return out;
}
