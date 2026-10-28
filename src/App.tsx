import { useCallback, useEffect, useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { AgentSelection } from './components/AgentSelection';
import { MetaScreen } from './components/MetaScreen';
import { StatsScreen } from './components/StatsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { RankingScreen } from './components/RankingScreen';
import { DIFFICULTY_BY_ID } from './data/difficulty';
import { GameScreen } from './components/GameScreen';
import { AGENT_BY_ID } from './data/agents';
import { MAP_BY_ID } from './data/maps';
import { ACHIEVEMENTS } from './data/goals';
import { metaCost } from './data/meta';
import { RunResult } from './game/types';
import { SaveData, Settings, clearSave, loadSave, writeSave } from './utils/storage';
import { audio } from './utils/audio';

type Screen = 'menu' | 'agents' | 'meta' | 'stats' | 'settings' | 'ranking' | 'game';

export default function App() {
  const [save, setSave] = useState<SaveData>(loadSave);
  const [screen, setScreen] = useState<Screen>('menu');
  const [run, setRun] = useState<{ agentId: string; mapId: string; difficulty: string; key: number }>({ agentId: 'jett', mapId: 'ascent', difficulty: 'normal', key: 0 });

  const update = useCallback((fn: (s: SaveData) => SaveData) => {
    setSave(prev => { const n = fn(prev); writeSave(n); return n; });
  }, []);

  useEffect(() => { audio.configure(save.settings); }, [save.settings]);
  useEffect(() => {
    const unlock = () => { audio.unlock(); audio.startMusic(); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);

  const changeSettings = (p: Partial<Settings>) => update(s => ({ ...s, settings: { ...s.settings, ...p } }));

  const start = (agentId: string, mapId: string, difficulty: string) => {
    update(s => ({ ...s, lastAgent: agentId, lastMap: mapId, lastDifficulty: difficulty }));
    setRun(r => ({ agentId, mapId, difficulty, key: r.key + 1 }));
    setScreen('game');
  };

  const handleEnd = (r: RunResult): string[] => {
    const names: string[] = [];
    update(s => {
      const stats = { ...s.stats };
      stats.games++; if (r.win) stats.wins++;
      stats.kills += r.kills; stats.bossKills += r.bossKills; stats.damage += r.damage; stats.time += Math.round(r.time);
      stats.bestTime = Math.max(stats.bestTime, Math.floor(r.time)); stats.bestLevel = Math.max(stats.bestLevel, r.level);
      stats.bestKills = Math.max(stats.bestKills, r.kills); stats.credits += r.credits;
      const old = s.records[r.mapId] ?? { bestTime: 0, bestLevel: 0, wins: 0 };
      const records = { ...s.records, [r.mapId]: { bestTime: Math.max(old.bestTime, Math.floor(r.time)), bestLevel: Math.max(old.bestLevel, r.level), wins: old.wins + (r.win ? 1 : 0) } };
      const achievements = [...s.achievements];
      for (const a of ACHIEVEMENTS) {
        const [c, t] = a.progress(stats);
        if (c >= t && !achievements.includes(a.id)) { achievements.push(a.id); names.push(a.name); }
      }
      return { ...s, credits: s.credits + r.credits, stats, records, achievements };
    });
    return names;
  };

  const go = (s: Screen) => setScreen(s);
  const agent = AGENT_BY_ID[run.agentId], map = MAP_BY_ID[run.mapId], difficulty = DIFFICULTY_BY_ID[run.difficulty] ?? DIFFICULTY_BY_ID.normal;

  return (
    <div className="app">
      {screen !== 'game' && <div className="bg" aria-hidden="true"><i /><i /><i /></div>}
      {screen === 'menu' && <MainMenu save={save} go={go} />}
      {screen === 'agents' && (
        <AgentSelection save={save} back={() => go('menu')} start={start}
          unlock={id => update(s => { const a = AGENT_BY_ID[id]; return s.credits >= a.cost && !s.unlocked.includes(id) ? { ...s, credits: s.credits - a.cost, unlocked: [...s.unlocked, id] } : s; })} />
      )}
      {screen === 'meta' && (
        <MetaScreen save={save} back={() => go('menu')}
          buy={id => update(s => {
            const lv = s.meta[id], cost = metaCost(lv);
            return lv < 10 && s.credits >= cost ? { ...s, credits: s.credits - cost, meta: { ...s.meta, [id]: lv + 1 } } : s;
          })} />
      )}
      {screen === 'stats' && (
        <StatsScreen save={save} back={() => go('menu')} claim={(id, reward) => update(s => (s.claimed.includes(id) ? s : { ...s, credits: s.credits + reward, claimed: [...s.claimed, id] }))} />
      )}
      {screen === 'settings' && (
        <SettingsScreen settings={save.settings} change={changeSettings} back={() => go('menu')} reset={() => { const d = clearSave(); setSave(d); }} />
      )}
      {screen === 'ranking' && <RankingScreen back={() => go('menu')} />}
      {screen === 'game' && agent && map && (
        <GameScreen key={run.key} agent={agent} map={map} difficulty={difficulty} meta={save.meta} settings={save.settings}
          playerName={save.playerName} setPlayerName={n => update(s => ({ ...s, playerName: n }))}
          onEnd={handleEnd} onMenu={() => go('menu')} onRestart={() => setRun(r => ({ ...r, key: r.key + 1 }))} changeSettings={changeSettings} />
      )}
    </div>
  );
}
