// Botón «Descargar el juego»: instala la app con un clic donde el navegador lo permite y, si no, explica los pasos.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { platform, promptInstall, useInstall } from '../utils/install';
import { audio } from '../utils/audio';
import { t } from '../i18n';
import { Emo } from './MainMenu';

export function InstallButton({ onHover }: { onHover?: () => void }) {
  const { installed } = useInstall();
  const [help, setHelp] = useState(false);
  if (installed) return null;
  const click = async () => {
    audio.play('click');
    if (!(await promptInstall())) setHelp(true);
  };
  const where = platform();
  return (
    <>
      <button className="btn btn-install" onClick={click} onMouseEnter={onHover}><b><Emo e="📲" />{t('Descargar')}</b></button>
      {help && createPortal(
        <div className="install-help" role="dialog" aria-modal="true" aria-label={t('Descargar el juego')} onClick={() => setHelp(false)}>
          <div className="install-box" onClick={e => e.stopPropagation()}>
            <h3>{t('Descargar el juego')}</h3>
            <p>{t('Se instala como una app: icono propio, pantalla completa, carga más rápido y se actualiza sola. Es gratis y no ocupa casi nada.')}</p>
            <ol>
              {where === 'ios' && <>
                <li>{t('Abre esta página en Safari.')}</li>
                <li>{t('Pulsa el botón Compartir (el cuadrado con la flecha hacia arriba).')}</li>
                <li>{t('Elige «Añadir a pantalla de inicio» y pulsa «Añadir».')}</li>
              </>}
              {where === 'android' && <>
                <li>{t('Abre esta página en Chrome.')}</li>
                <li>{t('Pulsa el menú ⋮ de arriba a la derecha.')}</li>
                <li>{t('Elige «Instalar app» o «Añadir a pantalla de inicio».')}</li>
              </>}
              {where === 'desktop' && <>
                <li>{t('Abre esta página en Chrome o Edge.')}</li>
                <li>{t('Pulsa el icono de instalar de la barra de direcciones (una pantalla con una flecha) o, en el menú, «Instalar ENDLESS RIFT».')}</li>
                <li>{t('En Safari para Mac: menú Archivo → «Añadir al Dock».')}</li>
              </>}
            </ol>
            <button className="btn btn-red" onClick={() => { audio.play('click'); setHelp(false); }}><b>{t('Entendido')}</b></button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
