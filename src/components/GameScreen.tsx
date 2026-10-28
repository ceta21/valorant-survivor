import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Renderer } from '../game/Renderer';
import { Input } from '../game/Input';
import { AgentDef, MapDef, RunResult, UpgradeChoice } from '../game/types';
import { MetaLevels, Settings } from '../utils/storage';
import { audio } from '../utils/audio';
import { GameHUD, Hud } from './GameHUD';
import { UpgradeSelection } from './UpgradeSelection';
import { AudioControls } from './SettingsScreen';

interface Props {
  agent: AgentDef; map: MapDef; meta: MetaLevels; settings: Settings;
  onEnd: (r: RunResult) => string[];
  onMenu: () => void; onRestart: () => void; changeSettings: (s: Partial<Settings>) => void;
}
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function GameScreen({ agent, map, meta, settings, onEnd, onMenu, onRestart, changeSettings }: Props) {
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
    });
    const renderer = new Renderer(ctx, (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; });
    renderer.shake = settings.shake;
    engineRef.current = engine; rendererRef.current = renderer;
    const input = new Input(engine, togglePause);
    inputRef.current = input;

    const resize = () => {
      const w = box.clientWidth, h = box.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
      renderer.dpr = dpr;
      const v = renderer.resize(w, h);
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
          <h1>{result.r.win ? 'Victoria' : 'Derrota'}</h1>
          <p className="sub">{result.r.win ? 'El Cabecilla del Protocolo ha caído.' : 'Has caído en combate.'}</p>
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
