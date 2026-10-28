import { SaveData } from '../utils/storage';
import { AGENT_BY_ID } from '../data/agents';
import { AgentPortrait } from './AgentPortrait';
import { Logo } from './Logo';
import { audio } from '../utils/audio';
import type { Account } from '../utils/account';
import { LATEST_NEWS } from '../data/news';

type Screen = 'menu' | 'agents' | 'meta' | 'stats' | 'settings' | 'ranking' | 'market' | 'news';

interface Props {
  save: SaveData; go: (s: Screen) => void;
  account: Account | null; accountsEnabled: boolean; onLogin: () => void; onLogout: () => void;
}

export function MainMenu({ save, go, account, accountsEnabled, onLogin, onLogout }: Props) {
  const agent = AGENT_BY_ID[save.lastAgent] ?? AGENT_BY_ID.jett;
  const click = (s: Screen) => () => { audio.play('click'); go(s); };
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  return (
    <div className="screen menu">
      <div className="menu-left">
        <Logo />
        {accountsEnabled && (
          <div className="account-bar">
            {account ? (
              <>
                <span>Jugador <b>{account.username}</b> <em>#{account.playerId}</em></span>
                <button className="btn btn-sm" onClick={() => { audio.play('click'); onLogout(); }}><b>Cerrar sesión</b></button>
              </>
            ) : (
              <>
                <span><b>Invitado</b> · el progreso no se guarda</span>
                <button className="btn btn-sm btn-red" onClick={() => { audio.play('click'); onLogin(); }}><b>Iniciar sesión / Registrarse</b></button>
              </>
            )}
          </div>
        )}
        <nav className="menu-nav" aria-label="Menú principal">
          <button className="btn btn-red btn-xl" onClick={click('agents')} onMouseEnter={() => audio.play('hover')}><b>Jugar</b></button>
          <button className="btn" onClick={click('agents')} onMouseEnter={() => audio.play('hover')}><b>Agentes</b></button>
          <button className="btn" onClick={click('meta')} onMouseEnter={() => audio.play('hover')}><b>Mejoras</b></button>
          <button className="btn btn-market" onClick={click('market')} onMouseEnter={() => audio.play('hover')}><b>Mercado nocturno</b></button>
          <button className="btn" onClick={click('ranking')} onMouseEnter={() => audio.play('hover')}><b>Ranking global</b></button>
          <button className="btn" onClick={click('news')} onMouseEnter={() => audio.play('hover')}><b>Novedades{save.newsSeen !== LATEST_NEWS && <i className="news-badge">Nuevo</i>}</b></button>
          <button className="btn" onClick={click('stats')} onMouseEnter={() => audio.play('hover')}><b>Estadísticas</b></button>
          <button className="btn" onClick={click('settings')} onMouseEnter={() => audio.play('hover')}><b>Configuración</b></button>
        </nav>
        <p className="hint">WASD / flechas: moverse · Espacio / E / Q: habilidades · Esc: pausa</p>
      </div>
      <aside className="menu-right">
        <div className="menu-hero" style={{ ['--ac' as any]: agent.color }}>
          <AgentPortrait agent={agent} />
          <div className="hero-name"><small>{agent.role}</small><strong>{agent.name}</strong></div>
        </div>
        <dl className="progress">
          <div><dt>Créditos</dt><dd className="cred">{save.credits.toLocaleString('es-ES')}</dd></div>
          <div><dt>Partidas</dt><dd>{save.stats.games}</dd></div>
          <div><dt>Victorias</dt><dd>{save.stats.wins}</dd></div>
          <div><dt>Mejor tiempo</dt><dd>{fmt(save.stats.bestTime)}</dd></div>
          <div><dt>Eliminaciones</dt><dd>{save.stats.kills.toLocaleString('es-ES')}</dd></div>
          <div><dt>Agentes</dt><dd>{save.unlocked.length}/10</dd></div>
        </dl>
      </aside>
    </div>
  );
}
