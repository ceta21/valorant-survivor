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

interface Props {
  agent: AgentDef; map: MapDef; difficulty: DifficultyDef; startWeapon: string; meta: MetaLevels; settings: Settings;
  account: Account | null; playerName: string; setPlayerName: (n: string) => void;
  onEnd: (r: RunResult) => string[];
  onMenu: () => void; onRestart: () => void; changeSettings: (s: Partial<Settings>) => void;
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
    if (!n) { setState('error'); setMsg('Escribe un nombre'); return; }
    setState('sending'); if (!account) setName(n);
    try {
      await submitScore({ name: n, agent: r.agentId, difficulty: r.difficulty, map: r.mapId, time: r.time, kills: r.kills, level: r.level, boss_kills: r.bossKills });
      setState('done'); setMsg(isGlobal ? '¡Marca publicada en el ranking global!' : 'Marca guardada en el ranking local.');
    } catch (e: any) { setState('error'); setMsg(String(e?.message ?? e)); }
  };
  if (state === 'done') return <p className="rank-sent">{msg}</p>;
  if (account) return <p className={state === 'error' ? 'rank-err' : 'rank-sent'}>{state === 'error' ? msg : `Publicando como ${account.username} #${account.playerId}…`}</p>;
  return (
    <form className="rank-submit" onSubmit={e => { e.preventDefault(); send(); }}>
      <label htmlFor="rank-name">Tu nombre para el ranking</label>
      <div>
        <input id="rank-name" value={draft} maxLength={16} autoComplete="nickname" placeholder="Jugador" onChange={e => setDraft(e.target.value)} onKeyDown={e => e.stopPropagation()} />
        <button className="btn btn-sm" type="submit" disabled={state === 'sending'}><b>{state === 'sending' ? 'Enviando…' : 'Publicar'}</b></button>
      </div>
      {state === 'error' && <p className="rank-err">{msg}</p>}
    </form>
  );
}

export function GameScreen({ agent, map, difficulty, startWeapon, meta, settings, account, playerName, setPlayerName, onEnd, onMenu, onRestart, changeSettings }: Props) {
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

  const togglePause = useCallback(() => {
    const e = engineRef.current;
    if (!e || e.state === 'levelup' || e.state === 'won' || e.state === 'lost') return;
    e.togglePause();
    setPaused(e.state === 'paused');
  }, []);

  useEffect(() => { if (rendererRef.current) rendererRef.current.shake = settings.shake; }, [settings.shake]);

  useEffect(() => {
    const canvas = canvasRef.current!, box = wrap.current!;
    const ctx = canvas.getContext('2d')!;
    const engine = new GameEngine(agent, map, meta, {
      onLevelUp: c => setChoices([...c]),
      onEnd: r => { const ach = onEndRef.current(r); setResult({ r, ach }); },
      sfx: n => audio.play(n),
    }, difficulty, startWeapon);
    const renderer = new Renderer(ctx, (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; });
    renderer.shake = settings.shake;
    engineRef.current = engine; rendererRef.current = renderer;
    const input = new Input(engine, togglePause);
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

    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      input.poll();
      engine.update(dt);
      renderer.render(engine);
      audio.setIntensity(Math.min(1, engine.time / 540));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const hudTimer = window.setInterval(() => { setHud(engine.hud()); }, 100);

    const auto = () => { if (settings.autoPause && engine.state === 'playing') { engine.pause(); setPaused(true); } };
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
      cancelAnimationFrame(raf); clearInterval(hudTimer); ro.disconnect(); input.destroy();
      document.removeEventListener('visibilitychange', vis); window.removeEventListener('blur', auto);
      canvas.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); window.removeEventListener('pointercancel', pu);
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const engine = engineRef.current;
  const pick = (i: number) => { engine?.chooseUpgrade(i); setChoices(engine && engine.state === 'levelup' ? [...engine.choices] : null); };
  const reroll = () => { engine?.reroll(); };

  return (
    <div className="game" ref={wrap}>
      <canvas ref={canvasRef} className="game-canvas" />
      {hud && engine && <GameHUD hud={hud} engine={engine} onPause={togglePause} />}
      {choices && hud?.state === 'levelup' && engine && (
        <UpgradeSelection choices={choices} rerolls={engine.rerolls} level={engine.level} pick={pick} reroll={reroll} />
      )}
      {paused && !result && (
        <div className="overlay pause" role="dialog" aria-label="Pausa">
          <h2>Pausa</h2>
          <div className="pause-box">
            <AudioControls settings={settings} change={changeSettings} />
          </div>
          <div className="pause-btns">
            <button className="btn btn-red btn-xl" onClick={togglePause}><b>Reanudar</b></button>
            <button className="btn" onClick={onRestart}><b>Reiniciar</b></button>
            <button className="btn" onClick={onMenu}><b>Abandonar</b></button>
          </div>
        </div>
      )}
      {result && (
        <div className={`overlay end ${result.r.win ? 'win' : 'lose'}`} role="dialog" aria-label="Resultado">
          <h1>{fmt(result.r.time)}</h1>
          <p className="sub">
            {result.r.win ? 'Derrotaste al Cabecilla del Protocolo y aguantaste el modo infinito.' : 'Has caído en combate.'}
            {' '}<span style={{ color: difficulty.color }}>{difficulty.name}</span>
          </p>
          <SubmitScore r={result.r} account={account} name={playerName} setName={setPlayerName} />
          <dl className="end-stats">
            <div><dt>Tiempo</dt><dd>{fmt(result.r.time)}</dd></div>
            <div><dt>Eliminaciones</dt><dd>{result.r.kills}</dd></div>
            <div><dt>Nivel</dt><dd>{result.r.level}</dd></div>
            <div><dt>Daño</dt><dd>{result.r.damage.toLocaleString('es-ES')}</dd></div>
            <div><dt>Jefes</dt><dd>{result.r.bossKills}</dd></div>
            <div className="reward"><dt>Créditos</dt><dd>+◈ {result.r.credits}</dd></div>
          </dl>
          {result.ach.length > 0 && <p className="ach">Logro desbloqueado: {result.ach.join(', ')}</p>}
          <div className="pause-btns">
            <button className="btn btn-red btn-xl" onClick={onRestart}><b>Jugar otra vez</b></button>
            <button className="btn" onClick={onMenu}><b>Volver al menú</b></button>
          </div>
        </div>
      )}
    </div>
  );
}
