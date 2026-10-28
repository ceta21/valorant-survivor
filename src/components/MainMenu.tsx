import { SaveData } from '../utils/storage';
import { AGENT_BY_ID } from '../data/agents';
import { AgentPortrait } from './AgentPortrait';
import { Logo } from './Logo';
import { audio } from '../utils/audio';
import type { Account } from '../utils/account';
import { LATEST_NEWS } from '../data/news';
import { MenuHub } from './MenuHub';
import { t, nf } from '../i18n';
import { KeyMap, keyLabel } from '../game/controls';

type Screen = 'menu' | 'agents' | 'meta' | 'stats' | 'settings' | 'ranking' | 'market' | 'news' | 'coop' | 'support';

interface Props {
  save: SaveData; go: (s: Screen) => void;
  account: Account | null; accountsEnabled: boolean; onLogin: () => void; onLogout: () => void; keys: KeyMap;
}

export function MainMenu({ save, go, account, accountsEnabled, onLogin, onLogout, keys }: Props) {
  const agent = AGENT_BY_ID[save.lastAgent] ?? AGENT_BY_ID.jett;
  const click = (s: Screen) => () => { audio.play('click'); go(s); };
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
                <span>{t('Jugador')} <b>{account.username}</b> <em>#{account.playerId}</em>{account.isAdmin && <i className="admin-badge">Admin</i>}</span>
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
          <button className="btn btn-red btn-xl" onClick={click('agents')} onMouseEnter={() => audio.play('hover')}><b>{t('Jugar')}</b></button>
          <button className="btn btn-coop" onClick={click('coop')} onMouseEnter={() => audio.play('hover')}><b>{t('Jugar en pareja')}</b></button>
          <button className="btn" onClick={click('agents')} onMouseEnter={() => audio.play('hover')}><b>{t('Agentes')}</b></button>
          <button className="btn" onClick={click('meta')} onMouseEnter={() => audio.play('hover')}><b>{t('Mejoras')}</b></button>
          <button className="btn btn-market" onClick={click('market')} onMouseEnter={() => audio.play('hover')}><b>{t('Mercado nocturno')}</b></button>
          <button className="btn" onClick={click('ranking')} onMouseEnter={() => audio.play('hover')}><b>{t('Ranking global')}</b></button>
          <button className="btn" onClick={click('news')} onMouseEnter={() => audio.play('hover')}><b>{t('Novedades')}{save.newsSeen !== LATEST_NEWS && <i className="news-badge">{t('Nuevo')}</i>}</b></button>
          <button className="btn" onClick={click('stats')} onMouseEnter={() => audio.play('hover')}><b>{t('Estadísticas')}</b></button>
          <button className="btn" onClick={click('settings')} onMouseEnter={() => audio.play('hover')}><b>{t('Configuración')}</b></button>
          <button className="btn btn-support" onClick={click('support')} onMouseEnter={() => audio.play('hover')}><b>{t('Apoyo')}</b></button>
        </nav>
        <p className="hint">{t('{move} / flechas: moverse · {abil}: habilidades · Esc: pausa', { move, abil: [keys.special, keys.secondary, keys.ultimate].map(keyLabel).join(' / ') })}</p>
      </div>
      <MenuHub save={save} go={go} />
      <aside className="menu-right">
        <div className="menu-hero" style={{ ['--ac' as any]: agent.color }}>
          <AgentPortrait agent={agent} />
          <div className="hero-name"><small>{t(agent.role)}</small><strong>{t(agent.name)}</strong></div>
        </div>
        <dl className="progress">
          <div><dt>{t('Créditos')}</dt><dd className="cred">{nf(save.credits)}</dd></div>
          <div><dt>{t('Partidas')}</dt><dd>{save.stats.games}</dd></div>
          <div><dt>{t('Victorias')}</dt><dd>{save.stats.wins}</dd></div>
          <div><dt>{t('Mejor tiempo')}</dt><dd>{fmt(save.stats.bestTime)}</dd></div>
          <div><dt>{t('Eliminaciones')}</dt><dd>{nf(save.stats.kills)}</dd></div>
          <div><dt>{t('Agentes')}</dt><dd>{save.unlocked.length}/10</dd></div>
        </dl>
      </aside>
    </div>
  );
}
