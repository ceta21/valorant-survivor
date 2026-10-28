import { useEffect, useState } from 'react';
import { Settings, Prefs } from '../utils/storage';
import { audio } from '../utils/audio';
import { t, LANGS, Lang } from '../i18n';
import { ACTIONS, Action, DEFAULT_KEYS, KeyMap, RESERVED, keyLabel } from '../game/controls';

interface Props {
  settings: Settings; change: (s: Partial<Settings>) => void; back: () => void; reset: () => void;
  prefs: Prefs; changePrefs: (p: Partial<Prefs>) => void;
}

export function SettingsScreen({ settings, change, back, reset, prefs, changePrefs }: Props) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="screen settings">
      <header className="top">
        <button className="btn btn-sm" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>
        <h2>{t('Configuración')}</h2>
        <span />
      </header>
      <div className="settings-body">
        <h3 className="settings-h">{t('Sonido y pantalla')}</h3>
        <AudioControls settings={settings} change={change} />
        <label className="row"><span>{t('Sacudida de pantalla')}</span><input type="checkbox" checked={settings.shake} onChange={e => change({ shake: e.target.checked })} /></label>
        <label className="row"><span>{t('Pausa automática al salir de la pestaña')}</span><input type="checkbox" checked={settings.autoPause} onChange={e => change({ autoPause: e.target.checked })} /></label>

        <h3 className="settings-h">{t('Idioma')}</h3>
        <div className="row lang-row" role="radiogroup" aria-label={t('Idioma')}>
          {LANGS.map(l => (
            <button key={l.id} role="radio" aria-checked={prefs.lang === l.id} className={`map-chip ${prefs.lang === l.id ? 'on' : ''}`}
              onClick={() => { audio.play('click'); changePrefs({ lang: l.id as Lang }); }}>
              <i className="lang-flag">{l.flag}</i><b>{l.name}</b>
            </button>
          ))}
        </div>

        <h3 className="settings-h">{t('Controles')}</h3>
        <Controls keys={prefs.keys} change={keys => changePrefs({ keys })} />

        <div className="danger">
          <h3>{t('Progreso guardado')}</h3>
          <p>{t('Con cuenta se guarda en tu cuenta; como invitado, solo mientras la página esté abierta. Borrarlo elimina créditos, agentes, mejoras y estadísticas.')}</p>
          {!confirm ? (
            <button className="btn" onClick={() => setConfirm(true)}><b>{t('Borrar progreso')}</b></button>
          ) : (
            <div className="confirm"><span>{t('¿Seguro? No se puede deshacer.')}</span>
              <button className="btn btn-red btn-sm" onClick={() => { reset(); setConfirm(false); }}><b>{t('Sí, borrar todo')}</b></button>
              <button className="btn btn-sm" onClick={() => setConfirm(false)}><b>{t('Cancelar')}</b></button></div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Lista de acciones con su tecla; al pulsar una, la siguiente tecla queda asignada. */
function Controls({ keys, change }: { keys: KeyMap; change: (k: KeyMap) => void }) {
  const [listening, setListening] = useState<Action | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (e.code === 'Escape') { setListening(null); setNote(''); return; }
      if (RESERVED.includes(e.code)) { setNote(t('Esa tecla está reservada. Elige otra.')); return; }
      // si la tecla ya estaba en otra acción, se intercambian
      const other = (Object.keys(keys) as Action[]).find(a => a !== listening && keys[a] === e.code);
      const next = { ...keys, [listening]: e.code };
      if (other) next[other] = keys[listening];
      change(next);
      audio.play('pick');
      setNote(other ? t('Intercambiada con «{a}».', { a: t(ACTIONS.find(x => x.id === other)!.label) }) : '');
      setListening(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [listening, keys, change]);

  const groups: [string, typeof ACTIONS][] = [
    [t('Movimiento'), ACTIONS.filter(a => a.group === 'move')],
    [t('Habilidades'), ACTIONS.filter(a => a.group === 'ability')],
    [t('Otros'), ACTIONS.filter(a => a.group === 'other')],
  ];
  const isDefault = (Object.keys(DEFAULT_KEYS) as Action[]).every(a => keys[a] === DEFAULT_KEYS[a]);
  return (
    <div className="controls">
      {groups.map(([title, list]) => (
        <div key={title} className="controls-group">
          <span className="controls-title">{title}</span>
          {list.map(a => (
            <div key={a.id} className="row control-row">
              <span>{t(a.label)}</span>
              <button className={`key-btn ${listening === a.id ? 'listening' : ''}`} onClick={() => { audio.play('click'); setNote(''); setListening(listening === a.id ? null : a.id); }}
                aria-label={t('Cambiar tecla de {a}', { a: t(a.label) })}>
                {listening === a.id ? t('Pulsa una tecla…') : keyLabel(keys[a.id])}
              </button>
            </div>
          ))}
        </div>
      ))}
      <p className="controls-note">{note || t('Las flechas también mueven y Esc siempre pausa. En el móvil, arrastra el dedo por la pantalla para moverte y toca los botones de habilidad.')}</p>
      <button className="btn btn-sm" disabled={isDefault} onClick={() => { audio.play('click'); change({ ...DEFAULT_KEYS }); setNote(''); }}><b>{t('Restaurar controles')}</b></button>
    </div>
  );
}

export function AudioControls({ settings, change }: { settings: Settings; change: (s: Partial<Settings>) => void }) {
  return (
    <>
      <div className="row">
        <span>{t('Música')}</span>
        <input type="range" min={0} max={1} step={0.05} value={settings.musicVol} onChange={e => change({ musicVol: +e.target.value })} aria-label={t('Volumen de música')} />
        <label className="mute"><input type="checkbox" checked={!settings.musicOn} onChange={e => change({ musicOn: !e.target.checked })} /> {t('Silenciar')}</label>
      </div>
      <div className="row">
        <span>{t('Efectos')}</span>
        <input type="range" min={0} max={1} step={0.05} value={settings.sfxVol} onChange={e => change({ sfxVol: +e.target.value })} onMouseUp={() => audio.play('pick')} aria-label={t('Volumen de efectos')} />
        <label className="mute"><input type="checkbox" checked={!settings.sfxOn} onChange={e => change({ sfxOn: !e.target.checked })} /> {t('Silenciar')}</label>
      </div>
    </>
  );
}
