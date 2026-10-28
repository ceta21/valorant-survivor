import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Renderer, PX } from '../game/Renderer';
import { Input } from '../game/Input';
import { AgentDef, MapDef, RunResult, UpgradeChoice } from '../game/types';
import { MetaLevels, Settings } from '../utils/storage';
import { audio } from '../utils/audio';
import { GameHUD, Hud } from './GameHUD';
import { UpgradeSelection } from './UpgradeSelection';
import { AudioControls } from './SettingsScreen';
import { DifficultyDef } from '../data/difficulty';
import { cleanName, isGlobal, submitScore } from '../utils/leaderboard';
import type { Account } from '../utils/account';
import type { PlayerSetup } from '../game/GameEngine';
import type { CoopLink } from '../net/coopLink';
import { applySnapshot, makeSnapshot, mirrorTick, Snap } from '../game/netSync';
import { t, nf } from '../i18n';
import { KeyMap } from '../game/controls';

interface Props {
  agent: AgentDef; map: MapDef; difficulty: DifficultyDef; startWeapon: string; meta: MetaLevels; settings: Settings;
  account: Account | null; playerName: string; setPlayerName: (n: string) => void;
  onEnd: (r: RunResult) => string[];
  onMenu: () => void; onRestart: () => void; changeSettings: (s: Partial<Settings>) => void;
  /** Partida cooperativa: conexión, jugadores e índice del de esta pantalla (0 = anfitrión). */
  coop?: { link: CoopLink; setups: PlayerSetup[]; local: number };
  keys: KeyMap;
}
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

/**
 * Final de partida: con cuenta, la marca se publica sola con tu nombre e ID;
 * como invitado, se pide un nombre.
 */
function SubmitScore({ r, account, name, setName }: { r: RunResult; account: Account | null; name: string; setName: (n: string) => void }) {
  const [draft, setDraft] = useState(name);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const sent = useRef(false);
  useEffect(() => { if (account && !sent.current) { sent.current = true; send(); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const send = async () => {
    const n = account ? account.username : cleanName(draft);
    if (!n) { setState('error'); setMsg(t('Escribe un nombre')); return; }
    setState('sending'); if (!account) setName(n);
    try {
      await submitScore({ name: n, agent: r.agentId, difficulty: r.difficulty, map: r.mapId, time: r.time, kills: r.kills, level: r.level, boss_kills: r.bossKills });
      setState('done'); setMsg(isGlobal ? t('¡Marca publicada en el ranking global!') : t('Marca guardada en el ranking local.'));
    } catch (e: any) { setState('error'); setMsg(String(e?.message ?? e)); }
  };
  if (state === 'done') return <p className="rank-sent">{msg}</p>;
  if (account) return <p className={state === 'error' ? 'rank-err' : 'rank-sent'}>{state === 'error' ? msg : t('Publicando como {n} #{id}…', { n: account.username, id: account.playerId })}</p>;
  return (
    <form className="rank-submit" onSubmit={e => { e.preventDefault(); send(); }}>
      <label htmlFor="rank-name">{t('Tu nombre para el ranking')}</label>
      <div>
        <input id="rank-name" value={draft} maxLength={16} autoComplete="nickname" placeholder={t('Jugador')} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.stopPropagation()} />
        <button className="btn btn-sm" type="submit" disabled={state === 'sending'}><b>{state === 'sending' ? t('Enviando…') : t('Publicar')}</b></button>
      </div>
      {state === 'error' && <p className="rank-err">{msg}</p>}
    </form>
  );
}

export function GameScreen({ agent, map, difficulty, startWeapon, meta, settings, account, playerName, setPlayerName, onEnd, onMenu, onRestart, changeSettings, coop, keys }: Props) {
  const isGuest = coop?.local === 1;
  const [lost, setLost] = useState('');
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<Input | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const onEndRef = useRef(onEnd); onEndRef.current = onEnd;
  const [hud, setHud] = useState<Hud | null>(null);
  const [choices, setChoices] = useState<UpgradeChoice[] | null>(null);
  const [result, setResult] = useState<{ r: RunResult; ach: string[] } | null>(null);
  const [paused, setPaused] = useState(false);

  // en cooperativo la partida no se detiene: el menú se abre encima mientras se sigue jugando
  const togglePause = useCallback(() => {
    const e = engineRef.current;
    if (!e || e.state === 'won' || e.state === 'lost') return;
    if (coop) { setPaused(p => !p); return; }
    if (e.state === 'levelup') return;
    e.togglePause();
    setPaused(e.state === 'paused');
  }, [coop]);
  const castRef = useRef<(slot: 'special' | 'secondary' | 'ultimate') => void>(() => {});

  useEffect(() => { if (rendererRef.current) rendererRef.current.shake = settings.shake; }, [settings.shake]);

  useEffect(() => {
    const canvas = canvasRef.current!, box = wrap.current!;
    const ctx = canvas.getContext('2d')!;
    const link = coop?.link;
    const engine = new GameEngine(agent, map, meta, {
      onLevelUp: (c, idx) => { if (idx === (coop?.local ?? 0)) setChoices([...c]); },
      onEnd: r => {
        if (isGuest) return;
        const ach = onEndRef.current(r); setResult({ r, ach });
        // el anfitrión manda su resultado al invitado
        if (link) link.send({ type: 'end', r: engine.resultFor(1) });
      },
      sfx: n => audio.play(n),
    }, difficulty, startWeapon, coop ? { setups: coop.setups, local: coop.local } : undefined);
    if (link && !isGuest) engine.netOut = [];
    if (import.meta.env.DEV) (window as any).__vs = engine;   // solo en desarrollo, para depurar
    const cast = (slot: 'special' | 'secondary' | 'ultimate') => {
      if (isGuest) { if (engine.state === 'playing' && !engine.me.dead) link!.send({ type: 'cast', slot }); }
      else engine.cast(slot);
    };
    castRef.current = cast;
    const offs: (() => void)[] = [];
    let lastChoices = '';
    if (link && !isGuest) {
      offs.push(
        link.on('in', m => { const mv = engine.players[1]?.inputMove; if (mv) { mv.x = +(m.x as number) || 0; mv.y = +(m.y as number) || 0; } }),
        link.on('cast', m => { engine.cast(m.slot as 'special', 1); }),
        link.on('pick', m => { engine.chooseUpgrade(m.i as number, 1); }),
        link.on('reroll', () => { engine.reroll(1); }),
        link.on('bye', () => engine.leave(1)),
        link.on('peer-left', () => engine.leave(1)),
      );
    } else if (link) {
      offs.push(
        link.on('snap', m => {
          applySnapshot(engine, m.s as Snap);
          const ch = engine.state === 'levelup' ? engine.me.choices : [];
          const key = JSON.stringify(ch);
          if (key !== lastChoices) { lastChoices = key; setChoices(ch.length ? [...ch] : null); }
        }),
        link.on('end', m => {
          engine.state = 'lost';
          const r = m.r as RunResult;
          const ach = onEndRef.current(r); setResult({ r, ach });
        }),
      );
      const gone = () => {
        if (engine.state === 'lost') return;
        engine.state = 'lost';
        setLost(t('Se perdió la conexión con el anfitrión.'));
        const r = engine.resultFor(1);
        const ach = onEndRef.current(r); setResult({ r, ach });
      };
      offs.push(link.on('bye', gone), link.on('peer-left', gone));
    }
    const renderer = new Renderer(ctx, (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; });
    renderer.shake = settings.shake;
    engineRef.current = engine; rendererRef.current = renderer;
    const input = new Input(engine, togglePause, cast, keys);
    inputRef.current = input;

    // pixel-art: se dibuja a baja resolución y el navegador lo amplía sin suavizar,
    // con un número entero de píxeles de pantalla por píxel de juego
    const resize = () => {
      const w = box.clientWidth, h = box.clientHeight, dpr = window.devicePixelRatio || 1;
      const zoom = Math.max(0.6, Math.min(1.25, Math.min(w / 1100, h / 640)));
      const scale = Math.max(2, Math.round(PX * zoom * dpr));
      const cw = Math.ceil((w * dpr) / scale), ch = Math.ceil((h * dpr) / scale);
      canvas.width = cw; canvas.height = ch;
      canvas.style.width = `${(cw * scale) / dpr}px`; canvas.style.height = `${(ch * scale) / dpr}px`;
      const v = renderer.resizePixels(cw, ch);
      engine.setView(v.w, v.h);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(box);

    let raf = 0, last = performance.now(), sendAcc = 0, lastIn = '', lastFrame = performance.now();
    const hostStep = (dt: number) => {
      engine.update(dt);
      if (!link) return;
      sendAcc += dt;
      if (sendAcc >= 1 / link.snapshotRate) { sendAcc = 0; link.send({ type: 'snap', s: makeSnapshot(engine) }, true); }
    };
    // Anfitrión: si su pestaña queda en segundo plano el navegador deja de dibujar, pero la partida
    // del compañero no puede pararse. Un Worker (que no se congela) da el ritmo mientras tanto.
    let ticker: Worker | null = null;
    if (link && !isGuest && typeof Worker !== 'undefined') {
      const src = URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 33)'], { type: 'text/javascript' }));
      ticker = new Worker(src);
      URL.revokeObjectURL(src);
      ticker.onmessage = () => {
        const now = performance.now();
        if (now - lastFrame < 150) return;          // los fotogramas normales ya llevan la partida
        input.poll();
        hostStep(Math.min(0.1, (now - last) / 1000)); last = now;
      };
    }
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      input.poll();
      if (isGuest) {
        // invitado: no simula; envía su movimiento y suaviza lo que llega del anfitrión
        mirrorTick(engine, dt);
        sendAcc += dt;
        const mv = engine.inputMove, key = `${mv.x.toFixed(2)},${mv.y.toFixed(2)}`;
        if (sendAcc >= 0.05 && (key !== lastIn || sendAcc >= 0.5)) { sendAcc = 0; lastIn = key; link!.send({ type: 'in', x: mv.x, y: mv.y }, true); }
      } else hostStep(dt);
      lastFrame = now;
      renderer.render(engine);
      audio.setIntensity(Math.min(1, engine.time / 540));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const hudTimer = window.setInterval(() => { setHud(engine.hud()); }, 100);

    const auto = () => {
      // el invitado deja de moverse si cambia de pestaña (el anfitrión conserva su última dirección)
      if (isGuest) { engine.inputMove.x = engine.inputMove.y = 0; link!.send({ type: 'in', x: 0, y: 0 }); }
      if (!coop && settings.autoPause && engine.state === 'playing') { engine.pause(); setPaused(true); }
    };
    const vis = () => { if (document.hidden) auto(); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('blur', auto);

    // joystick táctil
    let origin: { x: number; y: number } | null = null;
    const pd = (e: PointerEvent) => { if (e.pointerType === 'touch') origin = { x: e.clientX, y: e.clientY }; };
    const pm = (e: PointerEvent) => {
      if (!origin) return;
      const dx = e.clientX - origin.x, dy = e.clientY - origin.y, l = Math.hypot(dx, dy);
      if (l < 8) input.setStick(0, 0); else input.setStick(dx / Math.max(l, 50), dy / Math.max(l, 50));
    };
    const pu = () => { origin = null; input.setStick(0, 0); };
    canvas.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pm); window.addEventListener('pointerup', pu); window.addEventListener('pointercancel', pu);

    return () => {
      cancelAnimationFrame(raf); clearInterval(hudTimer); ticker?.terminate(); ro.disconnect(); input.destroy(); offs.forEach(f => f());
      document.removeEventListener('visibilitychange', vis); window.removeEventListener('blur', auto);
      canvas.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); window.removeEventListener('pointercancel', pu);
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const engine = engineRef.current;
  const pick = (i: number) => {
    if (isGuest) { coop!.link.send({ type: 'pick', i }); setChoices(null); return; }
    engine?.chooseUpgrade(i);
    setChoices(engine && engine.state === 'levelup' && engine.choices.length ? [...engine.choices] : null);
  };
  const reroll = () => { if (isGuest) coop!.link.send({ type: 'reroll' }); else engine?.reroll(); };

  return (
    <div className="game" ref={wrap}>
      <canvas ref={canvasRef} className="game-canvas" />
      {hud && engine && <GameHUD hud={hud} engine={engine} onPause={togglePause} onCast={slot => castRef.current(slot)} keys={keys} />}
      {coop && hud?.state === 'levelup' && !choices && !result && (
        <div className="coop-wait-banner">{t('Esperando a que tu compañero elija su mejora…')}</div>
      )}
      {coop && hud?.dead && !result && <div className="coop-wait-banner down">{t('Has caído · vuelves en la próxima oleada')}</div>}
      {choices && hud?.state === 'levelup' && engine && (
        <UpgradeSelection choices={choices} rerolls={engine.rerolls} level={engine.level} pick={pick} reroll={reroll} rerollKey={keys.reroll} />
      )}
      {paused && !result && (
        <div className="overlay pause" role="dialog" aria-label={t('Pausa')}>
          <h2>{coop ? t('Menú') : t('Pausa')}</h2>
          {coop && <p className="sub">{t('La partida sigue en marcha mientras tanto.')}</p>}
          <div className="pause-box">
            <AudioControls settings={settings} change={changeSettings} />
          </div>
          <div className="pause-btns">
            <button className="btn btn-red btn-xl" onClick={togglePause}><b>{coop ? t('Volver a la partida') : t('Reanudar')}</b></button>
            {!coop && <button className="btn" onClick={onRestart}><b>{t('Reiniciar')}</b></button>}
            <button className="btn" onClick={onMenu}><b>{t('Abandonar')}</b></button>
          </div>
        </div>
      )}
      {result && (
        <div className={`overlay end ${result.r.win ? 'win' : 'lose'}`} role="dialog" aria-label={t('Resultado')}>
          <h1>{fmt(result.r.time)}</h1>
          <p className="sub">
            {lost || (result.r.win ? t('Derrotaste al Cabecilla del Protocolo y aguantaste el modo infinito.') : coop ? t('Habéis caído los dos.') : t('Has caído en combate.'))}
            {' '}<span style={{ color: difficulty.color }}>{t(difficulty.name)}</span>
          </p>
          {coop
            ? <p className="sub">{t('Las partidas en pareja no cuentan para el ranking.')}</p>
            : <SubmitScore r={result.r} account={account} name={playerName} setName={setPlayerName} />}
          <dl className="end-stats">
            <div><dt>{t('Tiempo')}</dt><dd>{fmt(result.r.time)}</dd></div>
            <div><dt>{t('Eliminaciones')}</dt><dd>{nf(result.r.kills)}</dd></div>
            <div><dt>{t('Nivel')}</dt><dd>{result.r.level}</dd></div>
            <div><dt>{t('Daño')}</dt><dd>{nf(result.r.damage)}</dd></div>
            <div><dt>{t('Jefes')}</dt><dd>{result.r.bossKills}</dd></div>
            <div className="reward"><dt>{t('Créditos')}</dt><dd>+◈ {nf(result.r.credits)}</dd></div>
          </dl>
          {result.ach.length > 0 && <p className="ach">{t('Logro desbloqueado:')} {result.ach.map(a => t(a)).join(', ')}</p>}
          <div className="pause-btns">
            {!coop && <button className="btn btn-red btn-xl" onClick={onRestart}><b>{t('Jugar otra vez')}</b></button>}
            <button className={`btn ${coop ? 'btn-red btn-xl' : ''}`} onClick={onMenu}><b>{t('Volver al menú')}</b></button>
          </div>
        </div>
      )}
    </div>
  );
}
