import { SaveData } from '../utils/storage';
import { frameOf } from '../data/frames';
import { AGENTS, AGENT_BY_ID, playableAgent } from '../data/agents';
import { AgentPortrait } from './AgentPortrait';
import { Logo } from './Logo';
import { audio } from '../utils/audio';
import type { Account } from '../utils/account';
import { LATEST_NEWS } from '../data/news';
import { hasDailyReward } from '../data/daily';
import { MenuHub } from './MenuHub';
import { MEDALS } from '../data/sundayRank';
import { t, nf } from '../i18n';
import { KeyMap, keyLabel } from '../game/controls';
import { InstallButton } from './InstallButton';

type Screen = 'menu' | 'agents' | 'meta' | 'stats' | 'settings' | 'ranking' | 'market' | 'news' | 'coop' | 'support' | 'daily' | 'shop' | 'pets' | 'gear';

interface Props {
  save: SaveData; go: (s: Screen) => void;
  account: Account | null; accountsEnabled: boolean; onLogin: () => void; onLogout: () => void; keys: KeyMap;
}

/** Emoticono decorativo delante del nombre de cada botón o panel. */
export const Emo = ({ e }: { e: string }) => <span className="emo" aria-hidden="true">{e}</span>;

export function MainMenu({ save, go, account, accountsEnabled, onLogin, onLogout, keys }: Props) {
  const agent = AGENT_BY_ID[playableAgent(save.lastAgent)] ?? AGENT_BY_ID.zephyr;
  const click = (s: Screen) => () => { audio.play('click'); go(s); };
  const hover = () => {};   // el sonido al pasar por un botón lo pone App para todo el menú
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const move = [keys.up, keys.left, keys.down, keys.right].map(keyLabel).join('');
  return (
    <div className="screen menu">
      <div className="menu-left">
        <Logo />
        {accountsEnabled && (
          <div className="account-bar">
            {account ? (
              <>
                <span>{t('Jugador')} <b>{account.username}</b> <em>#{account.playerId}</em>{account.isAdmin && <i className="admin-badge">Admin</i>}{(save.sundayMedals?.length ?? 0) > 0 && <i className="medals" title={t('Medallas del ranking del domingo')}>{[0, 1, 2].map(p => { const n = save.sundayMedals!.filter(m => m.place === p).length; return n ? <span key={p}>{MEDALS[p]}{n > 1 ? `×${n}` : ''}</span> : null; })}</i>}</span>
                <button className="btn btn-sm" onClick={() => { audio.play('click'); onLogout(); }}><b>{t('Cerrar sesión')}</b></button>
              </>
            ) : (
              <>
                <span><b>{t('Invitado')}</b> · {t('el progreso no se guarda')}</span>
                <button className="btn btn-sm btn-red" onClick={() => { audio.play('click'); onLogin(); }}><b>{t('Iniciar sesión / Registrarse')}</b></button>
              </>
            )}
          </div>
        )}
        <nav className="menu-nav" aria-label={t('Menú principal')}>
          {/* Jugar y Jugar en pareja ocupan todo el ancho; el resto va en dos columnas para que quepa sin scroll */}
          <button className="btn btn-red btn-xl wide" onClick={click('agents')} onMouseEnter={hover}><b><Emo e="🎮" />{t('Jugar')}</b></button>
          <button className="btn btn-coop wide" onClick={click('coop')} onMouseEnter={hover}><b><Emo e="👥" />{t('Jugar en pareja')}</b></button>
          <button className="btn" onClick={click('agents')} onMouseEnter={hover}><b><Emo e="🦸" />{t('Héroes')}</b></button>
          <button className="btn" onClick={click('pets')} onMouseEnter={hover}><b><Emo e="🐾" />{t('Mascotas')}</b></button>
          <button className="btn" onClick={click('gear')} onMouseEnter={hover}><b><Emo e="🎒" />{t('Equipo')}</b></button>
          <button className="btn btn-daily" onClick={click('daily')} onMouseEnter={hover}><b><Emo e="📅" />{t('Diario')}{hasDailyReward(save.daily, save.login, save.unlocked) && <i className="news-badge">!</i>}</b></button>
          <button className="btn btn-shop" onClick={click('shop')} onMouseEnter={hover}><b><Emo e="🧺" />{t('Tienda')}</b></button>
          <button className="btn" onClick={click('meta')} onMouseEnter={hover}><b><Emo e="💪" />{t('Mejoras')}</b></button>
          <button className="btn btn-market" onClick={click('market')} onMouseEnter={hover}><b><Emo e="🌙" />{t('Mercado de la Grieta')}</b></button>
          <button className="btn" onClick={click('ranking')} onMouseEnter={hover}><b><Emo e="🏆" />{t('Ranking global')}</b></button>
          <button className="btn" onClick={click('news')} onMouseEnter={hover}><b><Emo e="📰" />{t('Novedades')}{save.newsSeen !== LATEST_NEWS && <i className="news-badge">!</i>}</b></button>
          <button className="btn" onClick={click('stats')} onMouseEnter={hover}><b><Emo e="📊" />{t('Estadísticas')}</b></button>
          <button className="btn" onClick={click('settings')} onMouseEnter={hover}><b><Emo e="⚙️" />{t('Configuración')}</b></button>
          {/* Descargar comparte fila con Configuración; ya instalado como app no sale */}
          <InstallButton onHover={hover} />
          <button className="btn btn-support wide" onClick={click('support')} onMouseEnter={hover}><b><Emo e="💚" />{t('Apoyo')}</b></button>
        </nav>
        <p className="hint">{t('{move} / flechas: moverse · {abil}: habilidades · Esc: pausa', { move, abil: [keys.special, keys.secondary, keys.ultimate].map(keyLabel).join(' / ') })}</p>
      </div>
      <MenuHub save={save} go={go} />
      <aside className="menu-right">
        <div className={`menu-hero pf-${frameOf(save)}`} style={{ ['--ac' as any]: agent.color }}>
          <AgentPortrait agent={agent} />
          <div className="hero-name"><small>{t(agent.role)}</small><strong>{t(agent.name)}</strong></div>
        </div>
        <dl className="progress">
          <div><dt>{t('Créditos')}</dt><dd className="cred">{nf(save.credits)}</dd></div>
          <div><dt>{t('Partidas')}</dt><dd>{save.stats.games}</dd></div>
          <div><dt>{t('Victorias')}</dt><dd>{save.stats.wins}</dd></div>
          <div><dt>{t('Mejor tiempo')}</dt><dd>{fmt(save.stats.bestTime)}</dd></div>
          <div><dt>{t('Eliminaciones')}</dt><dd>{nf(save.stats.kills)}</dd></div>
          <div><dt>{t('Héroes')}</dt><dd>{save.unlocked.length}/{AGENTS.length}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
