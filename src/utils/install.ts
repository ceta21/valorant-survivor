// Instalar el juego como app (PWA). Chrome, Edge y Android avisan con 'beforeinstallprompt' de que se puede instalar:
// se guarda ese aviso y el botón «Descargar el juego» lo lanza. Donde no existe (iPhone, Firefox, Safari en Mac) el
// botón enseña los pasos a mano. Se importa en main.tsx para no perder el aviso si llega antes de pintar el menú.
import { useEffect, useState } from 'react';

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let deferred: Prompt | null = null;
let installed = false;
const subs = new Set<() => void>();
const notify = () => subs.forEach(f => f());

/** ¿Se está usando ya como app instalada? */
export function isInstalled() {
  if (installed || typeof window === 'undefined') return installed;
  return ['standalone', 'fullscreen', 'minimal-ui'].some(m => window.matchMedia?.(`(display-mode: ${m})`).matches) || (navigator as any).standalone === true;
}
/** Dónde se juega, para saber qué pasos enseñar si no se puede instalar con un clic. */
export function platform(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return /android/i.test(ua) ? 'android' : 'desktop';
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as Prompt; notify(); });
  window.addEventListener('appinstalled', () => { installed = true; deferred = null; notify(); });
}

/** Lanza la instalación del navegador. Devuelve false si este navegador no la ofrece (hay que enseñar los pasos). */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const p = deferred; deferred = null;
  await p.prompt();
  const { outcome } = await p.userChoice;
  if (outcome === 'accepted') installed = true;
  notify();
  return true;
}

/** Estado para React: si ya está instalado y si el navegador permite instalar con un clic. */
export function useInstall() {
  const [, set] = useState(0);
  useEffect(() => { const f = () => set(n => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return { installed: isInstalled(), oneClick: !!deferred };
}
