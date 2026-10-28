import { FormEvent, useState } from 'react';
import { Logo } from './Logo';
import { audio } from '../utils/audio';
import { USERNAME_RE } from '../utils/account';
import { t } from '../i18n';

interface Props {
  /** Si se viene del menú como invitado, se puede volver atrás. */
  back?: () => void;
  guestHasProgress: boolean;
  onSignIn: (username: string, password: string) => Promise<void>;
  onSignUp: (username: string, password: string) => Promise<void>;
  onGuest: () => void;
}

/** Inicio de sesión, registro y acceso como invitado. */
export function AuthScreen({ back, guestHasProgress, onSignIn, onSignUp, onGuest }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError('');
    if (mode === 'register') {
      if (!USERNAME_RE.test(user.trim())) return setError(t('El nombre debe tener de 3 a 16 letras, números o _'));
      if (pass.length < 6) return setError(t('La contraseña debe tener al menos 6 caracteres'));
      if (pass !== pass2) return setError(t('Las contraseñas no coinciden'));
    } else if (!user.trim() || !pass) return setError(t('Escribe tu usuario y tu contraseña'));
    setBusy(true);
    audio.play('click');
    try {
      if (mode === 'login') await onSignIn(user, pass); else await onSignUp(user, pass);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setBusy(false);
    }
  };
  const swap = (m: 'login' | 'register') => { audio.play('click'); setMode(m); setError(''); setPass2(''); };

  return (
    <div className="screen auth">
      {back && <button className="btn btn-sm auth-back" onClick={() => { audio.play('click'); back(); }}><b>{t('Volver')}</b></button>}
      <div className="auth-box">
        <Logo />
        <div className="auth-tabs" role="tablist">
          <button role="tab" aria-selected={mode === 'login'} className={`map-chip ${mode === 'login' ? 'on' : ''}`} onClick={() => swap('login')}><b>{t('Iniciar sesión')}</b></button>
          <button role="tab" aria-selected={mode === 'register'} className={`map-chip ${mode === 'register' ? 'on' : ''}`} onClick={() => swap('register')}><b>{t('Registrarse')}</b></button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>{t('Nombre de usuario')}</span>
            <input value={user} onChange={e => setUser(e.target.value)} maxLength={16} autoComplete="username" autoFocus placeholder="Jugador_1" />
          </label>
          <label>
            <span>{t('Contraseña')}</span>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
          {mode === 'register' && (
            <label>
              <span>{t('Repite la contraseña')}</span>
              <input type="password" value={pass2} onChange={e => setPass2(e.target.value)} autoComplete="new-password" />
            </label>
          )}
          {mode === 'register' && <p className="auth-note">{t('Al registrarte recibirás un ID de jugador único.')}{guestHasProgress ? ' ' + t('Tu progreso como invitado se guardará en la cuenta.') : ''}</p>}
          {error && <p className="rank-err" role="alert">{error}</p>}
          <button className="btn btn-red btn-xl" type="submit" disabled={busy}>
            <b>{busy ? t('Un momento…') : mode === 'login' ? t('Entrar') : t('Crear cuenta')}</b>
          </button>
        </form>
        {!back && (
          <div className="auth-guest">
            <button className="btn" onClick={() => { audio.play('click'); onGuest(); }} disabled={busy}><b>{t('Jugar como invitado')}</b></button>
            <p className="auth-note">{t('Como invitado, tu progreso se pierde al cerrar la página.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
