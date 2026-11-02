import { CHALLENGE_BY_ID, Challenge, challengeWeek, weeklyChallenge } from './data/challenges';
import { frameOf } from './data/frames';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { AgentSelection } from './components/AgentSelection';
import { MetaScreen } from './components/MetaScreen';
import { StatsScreen } from './components/StatsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { RankingScreen } from './components/RankingScreen';
import { DIFFICULTY_BY_ID } from './data/difficulty';
import { GameScreen } from './components/GameScreen';
import { AGENTS, AGENT_BY_ID, isAvailable } from './data/agents';
import { gearBonus } from './data/gear';
import { MAP_BY_ID } from './data/maps';
import { Achievement, unlockAchievements } from './data/goals';
import { MEDALS, SUNDAY_PRIZES, lastFinishedSunday } from './data/sundayRank';
import { fetchScores } from './utils/leaderboard';
import { metaCost } from './data/meta';
import { RunResult } from './game/types';
import { SaveData, Settings, Prefs, vividFilter, clearLegacySave, defaultSave, loadLegacySave, loadPrefs, savePrefs } from './utils/storage';
import { nf, setLang, t } from './i18n';
import { Account, accountsEnabled, flushProgress, restoreSession, saveProgress, signIn, signOut, signUp } from './utils/account';
import { AuthScreen } from './components/AuthScreen';
import { MarketScreen } from './components/MarketScreen';
import { NewsScreen } from './components/NewsScreen';
import { SupportScreen } from './components/SupportScreen';
import { deviceKind, setAnalytics, track } from './utils/analytics';
import { UpdateToast } from './components/UpdateToast';
import { PrivacyScreen } from './components/PrivacyScreen';
import { CoopScreen, CoopStart } from './components/CoopScreen';
import type { CoopLink } from './net/coopLink';
import type { PlayerSetup } from './game/GameEngine';
import { LATEST_NEWS } from './data/news';
import { Offer, marketPeriod } from './data/market';
import { audio } from './utils/audio';
import { DailyScreen } from './components/DailyScreen';
import { ShopScreen } from './components/ShopScreen';
import { PetsScreen } from './components/PetsScreen';
import { GearScreen } from './components/GearScreen';
import { PET_POWER_PRICES, ShopSave, looksFor } from './data/shop';
import { LOGIN_REWARD, STREAK_REWARDS, addRun, dailyMissions, dayKey, todayProgress, touchLogin } from './data/daily';

type Screen = 'loading' | 'auth' | 'menu' | 'agents' | 'meta' | 'stats' | 'settings' | 'ranking' | 'market' | 'news' | 'coop' | 'support' | 'daily' | 'shop' | 'pets' | 'gear' | 'privacy' | 'game';

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
  const [run, setRun] = useState<{ agentId: string; mapId: string; difficulty: string; key: number; challenge?: { c: Challenge; done: boolean }; coop?: { link: CoopLink; setups: PlayerSetup[]; local: number; seed: number } }>({ agentId: 'zephyr', mapId: 'ascent', difficulty: 'normal', key: 0 });

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

  // la viveza del color también se aplica a los dibujos de los héroes fuera de la partida (retratos y tienda)
  useEffect(() => { document.documentElement.style.setProperty('--hero-vivid', vividFilter(prefs.vivid)); }, [prefs.vivid]);
  useEffect(() => { audio.configure(save.settings); setAnalytics(save.settings.analytics); }, [save.settings]);
  /** Avisos arriba: logros conseguidos y premios del ranking del domingo. */
  const [achToast, setAchToast] = useState<Pick<Achievement, 'id' | 'name' | 'reward'>[]>([]);
  // sonidos del menú: soplo al cambiar de pantalla, monedas al gastar o cobrar créditos y fanfarria con un logro
  const prevScreen = useRef(screen), prevCredits = useRef<number | null>(null);
  useEffect(() => {
    const from = prevScreen.current; prevScreen.current = screen;
    if (from !== screen && from !== 'loading' && screen !== 'game' && from !== 'game') audio.play('whoosh');
  }, [screen]);
  useEffect(() => {
    const was = prevCredits.current; prevCredits.current = save.credits;
    if (was === null || screen === 'game' || screen === 'loading' || screen === 'auth') return;
    if (save.credits < was) audio.play('buy'); else if (save.credits > was) audio.play('coin');
  }, [save.credits]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (achToast.length) audio.play('ach'); }, [achToast.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  // pasar el ratón por cualquier botón del menú suena (una vez al entrar en él)
  useEffect(() => {
    if (screen === 'game') return;
    let last: Element | null = null;
    const over = (ev: PointerEvent) => {
      if (ev.pointerType !== 'mouse') return;
      const b = (ev.target as Element)?.closest?.('button:not(:disabled), .btn');
      if (b && b !== last) audio.play('hover');
      last = b;
    };
    document.addEventListener('pointerover', over);
    return () => document.removeEventListener('pointerover', over);
  }, [screen]);
  useEffect(() => {
    // solo ya dentro (con la cuenta o como invitado): en la entrada aún no se sabe de quién es el guardado
    if (screen === 'game' || screen === 'loading' || screen === 'auth') return;
    const { got } = unlockAchievements(save);
    if (!got.length) return;
    update(s => unlockAchievements(s).save);
    audio.play('levelup');
    setAchToast(got);
  }, [save, screen]); // eslint-disable-line react-hooks/exhaustive-deps
  // los avisos se quitan solos a los 5 s (temporizador propio: guardar los créditos del logro no lo cancela)
  useEffect(() => {
    if (!achToast.length) return;
    const id = setTimeout(() => setAchToast([]), 5000);
    return () => clearTimeout(id);
  }, [achToast]);
  // ranking del domingo: el lunes (o después), si la cuenta quedó entre los 3 primeros del último domingo, cobra su premio
  const sundayChecked = useRef('');
  useEffect(() => {
    if (screen !== 'menu' || !account) return;
    const sw = lastFinishedSunday();
    if (sundayChecked.current === account.uid + sw.key || save.sundayMedals?.some(m => m.key === sw.key)) return;
    sundayChecked.current = account.uid + sw.key;
    fetchScores({ agent: 'all', difficulty: 'all', since: sw.start.toISOString(), until: sw.end.toISOString() }, 3).then(top => {
      const place = top.findIndex(r => r.user_id === account.uid);
      if (place < 0) return;
      const prize = SUNDAY_PRIZES[place];
      update(s => (s.sundayMedals?.some(m => m.key === sw.key) ? s : { ...s, credits: s.credits + prize, sundayMedals: [...(s.sundayMedals ?? []), { key: sw.key, place }] }));
      audio.play('win');
      setAchToast([{ id: 'sunday', name: t('{m} {n}.º en el ranking del domingo', { m: MEDALS[place], n: place + 1 }), reward: prize }]);
    }).catch(() => {});
  }, [screen, account]); // eslint-disable-line react-hooks/exhaustive-deps
  // estadística anónima: una visita (al salir de la pantalla de carga)
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || screen === 'loading') return;
    opened.current = true;
    track('open', { device: deviceKind(), lang: prefs.lang, nuevo: save.stats.games === 0, cuenta: !!account });
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps
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
      agent: AGENT_BY_ID[c.agentId] ?? AGENT_BY_ID.zephyr, meta: c.meta, name: c.name, looks: c.looks, gear: c.gear,
    }));
    setRun(r => ({ agentId: st.setups[local].agentId, mapId: st.mapId, difficulty: st.difficulty, key: r.key + 1, coop: { link, setups, local, seed: st.seed } }));
    setScreen('game');
  }, []);
  const leaveGame = () => { run.coop?.link.close(); setRun(r => ({ ...r, coop: undefined })); setScreen('menu'); };

  // en local (npm run dev) se pueden elegir todos los héroes para probarlos; no toca el guardado
  const pickSave = import.meta.env?.DEV ? { ...save, unlocked: AGENTS.map(a => a.id) } : save;
  // desafío semanal: se elige en el Diario y se aplica a la partida que empiece desde la elección de héroe
  const [pickChallenge, setPickChallenge] = useState(false);
  const start = (agentId: string, mapId: string, difficulty: string) => {
    if (!isAvailable(agentId)) return;   // héroe "Próximamente"
    update(s => ({ ...s, lastAgent: agentId, lastMap: mapId, lastDifficulty: difficulty }));
    const ch = pickChallenge ? weeklyChallenge() : undefined;
    setRun(r => ({ agentId, mapId, difficulty, key: r.key + 1, challenge: ch && { c: ch, done: save.challenge?.week === challengeWeek() && save.challenge.claimed } }));
    setPickChallenge(false);
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
    const m = dailyMissions(day, s.unlocked).find(x => x.id === id);
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

  // tienda
  const buyShop = (id: string, price: number) => update(s => {
    if (s.credits < price || s.shop.owned.includes(id)) return s;
    // la tienda solo compra: los estilos se ponen en Héroes y las mascotas en Mascotas
    return { ...s, credits: s.credits - price, shop: { ...s.shop, owned: [...s.shop.owned, id] } };
  });
  const equipShop = (fn: (s: ShopSave) => ShopSave) => update(s => ({ ...s, shop: fn(s.shop) }));
  const buyPetPower = (petId: string) => update(s => {
    const lv = s.shop.power[petId] ?? 0, price = PET_POWER_PRICES[lv];
    if (!s.shop.owned.includes(petId) || lv >= 3 || s.credits < price) return s;
    return { ...s, credits: s.credits - price, shop: { ...s.shop, power: { ...s.shop.power, [petId]: lv + 1 } } };
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
      // botín de los jefes al inventario de equipo
      const items = [...s.gear.items, ...(r.loot ?? []).map((l, i) => ({ uid: `${Date.now().toString(36)}${i}${Math.random().toString(36).slice(2, 6)}`, id: l.id, rarity: l.rarity, lvl: 1 }))];
      const next = { ...s, credits: s.credits + r.credits, stats, records, daily: addRun(s.daily, r), gear: { ...s.gear, items } };
      // logros (con esta partida): se suman sus créditos y se enseñan en el resultado
      // desafío semanal: guarda el mejor tiempo y, si se aguanta lo pedido, su premio (una vez por semana)
      if (r.challenge) {
        const week = challengeWeek(), c = CHALLENGE_BY_ID[r.challenge], old = next.challenge?.week === week ? next.challenge : { week, best: 0, claimed: false };
        const win = !!c && c.id === weeklyChallenge().id && !old.claimed && r.time >= c.goal;
        next.challenge = { week, best: Math.max(old.best, Math.floor(r.time)), claimed: old.claimed || win };
        if (win) next.credits += c.reward;
      }
      const { save: withAch, got } = unlockAchievements(next, r);
      names.splice(0, names.length, ...got.map(a => a.name));
      return withAch;
    });
    return names;
  };

  const revealCard = (slot: number) => update(s => {
    const period = marketPeriod(), cur = s.market.period === period ? s.market.revealed : [];
    return cur.includes(slot) ? s : { ...s, market: { period, revealed: [...cur, slot] } };
  });
  /** Compra una oferta del Mercado de la Grieta: va a la Tienda como si se hubiera comprado allí (más barata). */
  const buyOffer = (o: Offer) => update(s => s.credits < o.price || s.shop.owned.includes(o.id) ? s : { ...s, credits: s.credits - o.price, shop: { ...s.shop, owned: [...s.shop.owned, o.id] } });

  // la página de privacidad se abre desde el acceso, Apoyo o Configuración y vuelve a donde estabas
  const [privacyFrom, setPrivacyFrom] = useState<Screen>('menu');
  const openPrivacy = () => { setPrivacyFrom(screen); setScreen('privacy'); };
  const go = (s: Screen) => {
    if (s === 'news') update(v => (v.newsSeen === LATEST_NEWS ? v : { ...v, newsSeen: LATEST_NEWS }));
    setScreen(s);
  };
  const baseAgent = AGENT_BY_ID[run.agentId];
  const agent = baseAgent, map = MAP_BY_ID[run.mapId], difficulty = DIFFICULTY_BY_ID[run.difficulty] ?? DIFFICULTY_BY_ID.normal;

  return (
    <div className="app">
      {screen !== 'game' && <div className="bg" aria-hidden="true"><b className="rift-swirl" /><i /><i /><i /></div>}
      {/* transición: una franja de la grieta cruza la pantalla en cada cambio (al entrar en partida, un círculo que se abre) */}
      {screen !== 'loading' && <div key={'wipe-' + screen} className={`scr-wipe ${screen === 'game' ? 'iris' : ''}`} aria-hidden="true" />}
      <UpdateToast inGame={screen === 'game'} />
      {achToast.length > 0 && (
        <div className="ach-toast" role="status" onClick={() => setAchToast([])} title={t('Cerrar')}>
          {achToast.slice(0, achToast.length > 4 ? 3 : 4).map(a => <div key={a.id}><b>{a.id === 'sunday' ? a.name : <>🏆 {t('Logro')}: {t(a.name)}</>}</b><span>+◈ {nf(a.reward)}</span></div>)}
          {achToast.length > 4 && <div><b>{t('y {n} logros más', { n: achToast.length - 3 })}</b><span>+◈ {nf(achToast.slice(3).reduce((n, a) => n + a.reward, 0))}</span></div>}
        </div>
      )}
      {screen === 'loading' && <div className="screen auth"><p className="rank-msg">{t('Cargando…')}</p></div>}
      {screen === 'auth' && (
        <AuthScreen privacy={openPrivacy} back={authFromMenu ? () => { setAuthFromMenu(false); go('menu'); } : undefined} guestHasProgress={save.stats.games > 0 || save.credits > 0}
          onSignIn={doSignIn} onSignUp={doSignUp} onGuest={() => go('menu')} />
      )}
      {screen === 'menu' && <MainMenu save={save} go={go} account={account} accountsEnabled={accountsEnabled} onLogin={openAuth} onLogout={doSignOut} keys={prefs.keys} />}
      {screen === 'agents' && (
        <AgentSelection challenge={pickChallenge ? weeklyChallenge() : undefined} save={pickSave} back={() => { setPickChallenge(false); go('menu'); }} start={start} keys={prefs.keys}
          equip={equipShop}
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
        <StatsScreen save={save} setFrame={id => update(s => ({ ...s, frame: id }))} back={() => go('menu')} claim={(id, reward) => update(s => (s.claimed.includes(id) ? s : { ...s, credits: s.credits + reward, claimed: [...s.claimed, id] }))} />
      )}
      {screen === 'settings' && (
        <SettingsScreen privacy={openPrivacy} settings={save.settings} change={changeSettings} back={() => go('menu')} reset={() => update(() => defaultSave())} prefs={prefs} changePrefs={changePrefs} />
      )}
      {screen === 'ranking' && <RankingScreen back={() => go('menu')} />}
      {screen === 'news' && <NewsScreen back={() => go('menu')} />}
      {screen === 'support' && <SupportScreen back={() => go('menu')} privacy={openPrivacy} />}
      {screen === 'privacy' && <PrivacyScreen back={() => setScreen(privacyFrom)} />}
      {screen === 'shop' && <ShopScreen save={save} back={() => go('menu')} buy={buyShop} />}
      {screen === 'gear' && <GearScreen save={save} back={() => go('menu')} change={fn => update(s => { const r = fn(s.gear, s.credits); return r ? { ...s, gear: r.gear, credits: r.credits } : s; })} />}
      {screen === 'pets' && <PetsScreen save={save} back={() => go('menu')} goShop={() => go('shop')} equip={equipShop} buyPower={buyPetPower} />}
      {screen === 'daily' && <DailyScreen playChallenge={() => { setPickChallenge(true); setScreen('agents'); }} save={save} back={() => go('menu')} claimMission={claimDaily} claimLogin={claimLogin} claimStreak={claimStreak} />}
      {screen === 'coop' && <CoopScreen save={pickSave} name={account?.username ?? 'Invitado'} back={() => go('menu')} onStart={startCoop} />}
      {screen === 'market' && <MarketScreen save={save} seed={account?.uid ?? guestSeed} reveal={revealCard} buy={buyOffer} back={() => go('menu')} goAgents={() => go('agents')} goPets={() => go('pets')} />}
      {screen === 'game' && agent && map && (
        <GameScreen key={run.key} frame={frameOf(save)} challenge={run.coop ? undefined : run.challenge} keys={prefs.keys} low={prefs.low} vivid={prefs.vivid} looks={looksFor(save.shop, run.agentId)} gear={gearBonus(save.gear)} agent={run.coop ? run.coop.setups[run.coop.local].agent : agent} map={map} difficulty={difficulty} coop={run.coop} meta={save.meta} settings={save.settings}
          account={account} playerName={save.playerName} setPlayerName={n => update(s => ({ ...s, playerName: n }))}
          onEnd={handleEnd} onMenu={leaveGame} onRestart={() => setRun(r => ({ ...r, key: r.key + 1, challenge: r.challenge && { ...r.challenge, done: save.challenge?.week === challengeWeek() && save.challenge.claimed } }))} changeSettings={changeSettings} />
      )}
    </div>
  );
}
