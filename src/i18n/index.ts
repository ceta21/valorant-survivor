// Idiomas del juego. Los textos se escriben en español en el código y t() devuelve su
// traducción si el idioma activo es el inglés (si falta una traducción, se ve en español).
import { EN, EN_UPGRADE } from './en';

export type Lang = 'es' | 'en';
export const LANGS: { id: Lang; name: string; flag: string }[] = [
  { id: 'es', name: 'Español', flag: 'ES' },
  { id: 'en', name: 'English', flag: 'EN' },
];

let lang: Lang = 'es';
export const getLang = () => lang;
export function setLang(l: Lang) {
  lang = l === 'en' ? 'en' : 'es';
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}
/** Idioma inicial para quien no ha elegido: el del navegador si es inglés, si no español. */
export const browserLang = (): Lang => (typeof navigator !== 'undefined' && /^en/i.test(navigator.language) ? 'en' : 'es');

/** Traduce un texto escrito en español. {nombre} se sustituye por p.nombre. */
export function t(es: string, p?: Record<string, string | number>): string {
  let s = lang === 'en' ? EN[es] ?? es : es;
  if (p) s = s.replace(/\{(\w+)\}/g, (_, k) => (k in p ? String(p[k]) : `{${k}}`));
  return s;
}
/** Número con separador de miles del idioma activo. */
export const nf = (n: number) => n.toLocaleString(lang === 'en' ? 'en-US' : 'es-ES');
/** Descripción de una mejora de partida en el idioma activo. */
export const upgradeText = (id: string, v: number, es: (v: number) => string) => (lang === 'en' && EN_UPGRADE[id] ? EN_UPGRADE[id](v) : es(v));
