import { useCallback, useEffect, useRef, useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { AgentSelection } from './components/AgentSelection';
import { MetaScreen } from './components/MetaScreen';
import { StatsScreen } from './components/StatsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { RankingScreen } from './components/RankingScreen';
import { DIFFICULTY_BY_ID } from './data/difficulty';
import { GameScreen } from './components/GameScreen';
import { AGENT_BY_ID, withKit, isAvailable } from './data/agents';
import { MAP_BY_ID } from './data/maps';
import { ACHIEVEMENTS } from './data/goals';
import { metaCost } from './data/meta';
import { RunResult } from './game/types';
import { SaveData, Settings, Prefs, clearLegacySave, defaultSave, loadLegacySave, loadPrefs, savePrefs } from './utils/storage';
import { setLang, t } from './i18n';
import { Account, accountsEnabled, flushProgress, restoreSession, saveProgress, signIn, signOut, signUp } from './utils/account';
import { AuthScreen } from './components/AuthScreen';
import { MarketScreen } from './components/MarketScreen';
import { NewsScreen } from './components/NewsScreen';
import { SupportScreen } from './components/SupportScreen';
import { CoopScreen, CoopStart } from './components/CoopScreen';
import type { CoopLink } from './net/coopLink';
import type { PlayerSetup } from './game/GameEngine';
import { LATEST_NEWS } from './data/news';
import { Offer, marketPeriod } from './data/market';
import { WEAPONS } from './data/weapons';
import { audio } from './utils/audio';
import { DailyScreen } from './components/DailyScreen';
import { LOGIN_REWARD, STREAK_REWARDS, addRun, dailyMissions, dayKey, todayProgress, touchLogin } from './data/daily';

type Screen = 'loading' | 'auth' | 'menu' | 'agents' | 'meta' | 'stats' | 'settings' | 'ranking' | 'market' | 'news' | 'coop' | 'support' | 'daily' | 'game';

export default function App() {
  // Invitado: empieza con el progreso antiguo de este navegador (si lo hay) y no se guarda.
  const [save, setSave] = useState<SaveData>(loadLegacySave);
  // idioma y controles: preferencias de este dispositivo
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  setLang(prefs.lang);   // antes de pintar, para que toda la interfaz salga en el idioma elegido
  const changePrefs = (p: Partial<Prefs>) => setPrefs(o => { const n = { ...o, ...p }; savePrefs(n); return n; });
  const [account, setAccount] = useState<Account | null>(null);
  const [screen, setScreen] = useState<Screen>(accountsEnabled ? 'loading' : 'menu');
  const [authFromMenu, setAuthFromMenu] = useState(false);
  const accountRef = useRef<Account | null>(null); accountRef.current = account;
  // la tienda de un invitado cambia en cada visita (no tiene cuenta a la que atarla)
  const [guestSeed] = useState(() => `guest-${Math.random()}`);
  const [run, setRun] = useState<{ agentId: string; mapId: string; difficulty: string; key: number; coop?: { link: CoopLink; setups: PlayerSetup[]; local: number; seed: number } }>({ agentId: 'jett', mapId: 'ascent', difficulty: 'normal', key: 0 });

  const update = useCallback((fn: (s: SaveData) => SaveData) => {
    setSave(prev => { const n = fn(prev); if (n !== prev && accountRef.current) saveProgress(n); return n; });
  }, []);

  // sesión guardada en el navegador
  useEffect(() => {
    if (!accountsEnabled) return;
    restoreSession().then(r => {
      if (r) { setAccount(r.account); setSave(r.save); setScreen('menu'); } else setScreen('auth');
    });
    const flush = () => { if (document.visibilityState === 'hidden') flushProgress(); };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, []);

  const enter = (r: { account: Account; save: SaveData }) => { setAccount(r.account); setSave(r.save); setAuthFromMenu(false); setScreen('menu'); };
  const doSignIn = async (u: string, p: string) => enter(await signIn(u, p));
  const doSignUp = async (u: string, p: string) => { const r = await signUp(u, p, save); clearLegacySave(); enter(r); };
  const doSignOut = async () => { await signOut(); setAccount(null); setSave(defaultSave()); setScreen('auth'); };
  const openAuth = () => { setAuthFromMenu(true); setScreen('auth'); };

  useEffect(() => { audio.configure(save.settings); }, [save.settings]);
  useEffect(() => {
    const unlock = () => { audio.unlock(); audio.startMusic(); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  }, []);

  const changeSettings = (p: Partial<Settings>) => update(s => ({ ...s, settings: { ...s.settings, ...p } }));

  /** Empieza una partida cooperativa con lo acordado en la sala. */
  const startCoop = useCallback((link: CoopLink, st: CoopStart, local: number) => {
    const setups: PlayerSetup[] = st.setups.map(c => ({
      agent: withKit(AGENT_BY_ID[c.agentId] ?? AGENT_BY_ID.jett, c.kit), meta: c.meta, name: c.name,
      startWeapon: WEAPONS[c.loadout] ? c.loadout : 'classic',
    }));
    setRun(r => ({ agentId: st.setups[local].agentId, mapId: st.mapId, difficulty: st.difficulty, key: r.key + 1, coop: { link, setups, local, seed: st.seed } }));
    setScreen('game');
  }, []);
  const leaveGame = () => { run.coop?.link.close(); setRun(r => ({ ...r, coop: undefined })); setScreen('menu'); };

  const start = (agentId: string, mapId: string, difficulty: string) => {
    if (!isAvailable(agentId)) return;   // agente "Próximamente"
    update(s => ({ ...s, lastAgent: agentId, lastMap: mapId, lastDifficulty: difficulty }));
    setRun(r => ({ agentId, mapId, difficulty, key: r.key + 1 }));
    setScreen('game');
  };

  // racha de conexión: cuenta el día al entrar al juego (y a medianoche si sigue abierto)
  const inGame = screen !== 'loading' && screen !== 'auth';
  useEffect(() => {
    if (!inGame) return;
    const tick = () => update(s => { const l = touchLogin(s.login); return l === s.login ? s : { ...s, login: l }; });
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [inGame, account?.uid, update]);

  const claimDaily = (id: string) => update(s => {
    const day = dayKey(), d = todayProgress(s.daily, day);
    const m = dailyMissions(day, [...s.unlocked, ...s.exclusives]).find(x => x.id === id);
    if (!m || d.claimed.includes(id) || m.value(d) < m.goal) return s;
    return { ...s, credits: s.credits + m.reward, daily: { ...d, claimed: [...d.claimed, id] } };
  });
  const claimLogin = () => update(s => {
    const day = dayKey(), l = touchLogin(s.login, day);
    return l.dayClaimed === day ? s : { ...s, credits: s.credits + LOGIN_REWARD, login: { ...l, dayClaimed: day } };
  });
  const claimStreak = (n: number) => update(s => {
    const r = STREAK_REWARDS.find(x => x.day === n), l = s.login;
    return !r || l.streak < n || l.claimed.includes(n) ? s : { ...s, credits: s.credits + r.credits, login: { ...l, claimed: [...l.claimed, n] } };
  });

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
      return { ...s, credits: s.credits + r.credits, stats, records, achievements, daily: addRun(s.daily, r) };
    });
    return names;
  };

  const revealCard = (slot: number) => update(s => {
    const period = marketPeriod(), cur = s.market.period === period ? s.market.revealed : [];
    return cur.includes(slot) ? s : { ...s, market: { period, revealed: [...cur, slot] } };
  });
  const buyOffer = (o: Offer) => update(s => {
    if (s.credits < o.price || s.exclusives.includes(o.id)) return s;
    const a = AGENT_BY_ID[o.id];
    const kits = o.kind === 'agent' && a ? { ...s.kits, [o.id]: { special: a.special.id, secondary: a.secondary?.id ?? '', ultimate: a.ultimate.id } } : s.kits;
    return { ...s, credits: s.credits - o.price, exclusives: [...s.exclusives, o.id], kits, loadout: o.kind === 'weapon' ? o.id : s.loadout };
  });

  const go = (s: Screen) => {
    if (s === 'news') update(v => (v.newsSeen === LATEST_NEWS ? v : { ...v, newsSeen: LATEST_NEWS }));
    setScreen(s);
  };
  const startWeapon = WEAPONS[save.loadout] && (!WEAPONS[save.loadout].exclusive || save.exclusives.includes(save.loadout)) ? save.loadout : 'classic';
  const baseAgent = AGENT_BY_ID[run.agentId];
  const agent = baseAgent && withKit(baseAgent, save.kits[run.agentId]), map = MAP_BY_ID[run.mapId], difficulty = DIFFICULTY_BY_ID[run.difficulty] ?? DIFFICULTY_BY_ID.normal;

  return (
    <div className="app">
      {screen !== 'game' && <div className="bg" aria-hidden="true"><i /><i /><i /></div>}
      {screen === 'loading' && <div className="screen auth"><p className="rank-msg">{t('Cargando…')}</p></div>}
      {screen === 'auth' && (
        <AuthScreen back={authFromMenu ? () => { setAuthFromMenu(false); go('menu'); } : undefined} guestHasProgress={save.stats.games > 0 || save.credits > 0}
          onSignIn={doSignIn} onSignUp={doSignUp} onGuest={() => go('menu')} />
      )}
      {screen === 'menu' && <MainMenu save={save} go={go} account={account} accountsEnabled={accountsEnabled} onLogin={openAuth} onLogout={doSignOut} keys={prefs.keys} />}
      {screen === 'agents' && (
        <AgentSelection save={save} back={() => go('menu')} start={start} keys={prefs.keys}
          setKit={(id, kit) => update(s => ({ ...s, kits: { ...s.kits, [id]: kit } }))}
          setLoadout={id => update(s => ({ ...s, loadout: id }))}
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
        <SettingsScreen settings={save.settings} change={changeSettings} back={() => go('menu')} reset={() => update(() => defaultSave())} prefs={prefs} changePrefs={changePrefs} />
      )}
      {screen === 'ranking' && <RankingScreen back={() => go('menu')} />}
      {screen === 'news' && <NewsScreen back={() => go('menu')} />}
      {screen === 'support' && <SupportScreen back={() => go('menu')} />}
      {screen === 'daily' && <DailyScreen save={save} back={() => go('menu')} claimMission={claimDaily} claimLogin={claimLogin} claimStreak={claimStreak} />}
      {screen === 'coop' && <CoopScreen save={save} name={account?.username ?? 'Invitado'} back={() => go('menu')} onStart={startCoop} />}
      {screen === 'market' && <MarketScreen save={save} seed={account?.uid ?? guestSeed} reveal={revealCard} buy={buyOffer} back={() => go('menu')} goAgents={() => go('agents')} />}
      {screen === 'game' && agent && map && (
        <GameScreen key={run.key} keys={prefs.keys} agent={run.coop ? run.coop.setups[run.coop.local].agent : agent} map={map} difficulty={difficulty} startWeapon={startWeapon} coop={run.coop} meta={save.meta} settings={save.settings}
          account={account} playerName={save.playerName} setPlayerName={n => update(s => ({ ...s, playerName: n }))}
          onEnd={handleEnd} onMenu={leaveGame} onRestart={() => setRun(r => ({ ...r, key: r.key + 1 }))} changeSettings={changeSettings} />
      )}
    </div>
  );
}
