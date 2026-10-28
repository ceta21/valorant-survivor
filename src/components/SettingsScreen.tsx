import { useState } from 'react';
import { Settings } from '../utils/storage';
import { audio } from '../utils/audio';

interface Props { settings: Settings; change: (s: Partial<Settings>) => void; back: () => void; reset: () => void }

export function SettingsScreen({ settings, change, back, reset }: Props) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="screen settings">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>Volver</b></button>
        <h2>Configuración</h2>
        <span />
      </header>
      <div className="settings-body">
        <AudioControls settings={settings} change={change} />
        <label className="row"><span>Sacudida de pantalla</span><input type="checkbox" checked={settings.shake} onChange={e => change({ shake: e.target.checked })} /></label>
        <label className="row"><span>Pausa automática al salir de la pestaña</span><input type="checkbox" checked={settings.autoPause} onChange={e => change({ autoPause: e.target.checked })} /></label>
        <div className="danger">
          <h3>Progreso guardado</h3>
          <p>Se guarda solo en este navegador. Borrarlo elimina créditos, agentes, mejoras y estadísticas.</p>
          {!confirm ? (
            <button className="btn" onClick={() => setConfirm(true)}><b>Borrar progreso</b></button>
          ) : (
            <div className="confirm"><span>¿Seguro? No se puede deshacer.</span>
              <button className="btn btn-red btn-sm" onClick={() => { reset(); setConfirm(false); }}><b>Sí, borrar todo</b></button>
              <button className="btn btn-sm" onClick={() => setConfirm(false)}><b>Cancelar</b></button></div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AudioControls({ settings, change }: { settings: Settings; change: (s: Partial<Settings>) => void }) {
  return (
    <>
      <div className="row">
        <span>Música</span>
        <input type="range" min={0} max={1} step={0.05} value={settings.musicVol} onChange={e => change({ musicVol: +e.target.value })} aria-label="Volumen de música" />
        <label className="mute"><input type="checkbox" checked={!settings.musicOn} onChange={e => change({ musicOn: !e.target.checked })} /> Silenciar</label>
      </div>
      <div className="row">
        <span>Efectos</span>
        <input type="range" min={0} max={1} step={0.05} value={settings.sfxVol} onChange={e => change({ sfxVol: +e.target.value })} onMouseUp={() => audio.play('pick')} aria-label="Volumen de efectos" />
        <label className="mute"><input type="checkbox" checked={!settings.sfxOn} onChange={e => change({ sfxOn: !e.target.checked })} /> Silenciar</label>
      </div>
    </>
  );
}
