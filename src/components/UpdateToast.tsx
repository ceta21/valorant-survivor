// Aviso de versión nueva de la app: el juego queda guardado en el dispositivo (PWA) para cargar rápido; cuando se
// sube una versión nueva, se descarga sola y aquí se avisa. No recarga sin permiso para no cortar una partida.
// (Si el navegador no avisa de que la versión nueva ya manda, se recarga igualmente a los 1,5 s.)
import { useRegisterSW } from 'virtual:pwa-register/react';
import { audio } from '../utils/audio';
import { t } from '../i18n';

const CHECK_EVERY = 30 * 60 * 1000;   // con la app abierta, mira si hay versión nueva cada 30 min

export function UpdateToast({ inGame }: { inGame: boolean }) {
  const { needRefresh: [need, setNeed], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setInterval(() => { if (navigator.onLine) void reg.update(); }, CHECK_EVERY);
    },
  });
  // durante la partida no molesta: espera a que vuelva al menú
  if (!need || inGame) return null;
  return (
    <div className="update-toast" role="status">
      <span>{t('Hay una versión nueva del juego.')}</span>
      <button className="btn btn-red btn-sm" onClick={() => { audio.play('click'); void updateServiceWorker(true); setTimeout(() => location.reload(), 1500); }}><b>{t('Actualizar')}</b></button>
      <button className="btn btn-sm" onClick={() => setNeed(false)} aria-label={t('Más tarde')}><b>✕</b></button>
    </div>
  );
}
