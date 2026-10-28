import { SaveData } from '../utils/storage';
import { AGENT_BY_ID } from '../data/agents';
import { AgentPortrait } from './AgentPortrait';
import { Logo } from './Logo';
import { audio } from '../utils/audio';

type Screen = 'menu' | 'agents' | 'meta' | 'stats' | 'settings' | 'ranking';

export function MainMenu({ save, go }: { save: SaveData; go: (s: Screen) => void }) {
  const agent = AGENT_BY_ID[save.lastAgent] ?? AGENT_BY_ID.jett;
  const click = (s: Screen) => () => { audio.play('click'); go(s); };
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  return (
    <div className="screen menu">
      <div className="menu-left">
        <Logo />
        <nav className="menu-nav" aria-label="Menú principal">
          <button className="btn btn-red btn-xl" onClick={click('agents')} onMouseEnter={() => audio.play('hover')}><b>Jugar</b></button>
          <button className="btn" onClick={click('agents')} onMouseEnter={() => audio.play('hover')}><b>Agentes</b></button>
          <button className="btn" onClick={click('meta')} onMouseEnter={() => audio.play('hover')}><b>Mejoras</b></button>
          <button className="btn" onClick={click('ranking')} onMouseEnter={() => audio.play('hover')}><b>Ranking global</b></button>
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
