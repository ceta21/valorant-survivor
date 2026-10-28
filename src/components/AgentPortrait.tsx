import { useMemo } from 'react';
import { AgentDef } from '../game/types';
import { SW, SH, spriteRuns } from '../game/sprites';

// candado pixel-art (rejilla de 10x12)
const LOCK = ['  ######  ', ' ##    ## ', ' #      # ', ' #      # ', '##########', '##########', '####  ####', '####  ####', '##### ####', '##########', '##########', '##########'];

/** Retrato: personaje pixel-art original del agente sobre un fondo de bandas con su emblema. */
export function AgentPortrait({ agent, locked = false }: { agent: AgentDef; locked?: boolean }) {
  const runs = useMemo(() => spriteRuns(agent.id), [agent.id]);
  const c = agent.color, a = agent.accent, id = agent.id;
  return (
    <svg className="portrait" viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" role="img" aria-label={`Retrato de ${agent.name}`}>
      <defs>
        <pattern id={`st-${id}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#fff" opacity="0.06" /><rect x="8" y="8" width="4" height="4" fill="#fff" opacity="0.06" />
        </pattern>
      </defs>
      <rect width="200" height="240" fill="#0f1923" />
      {[0.55, 0.42, 0.3, 0.2, 0.12, 0.06].map((o, i) => <rect key={i} y={i * 40} width="200" height="40" fill={c} opacity={o} />)}
      <rect width="200" height="240" fill={`url(#st-${id})`} />
      <g transform="translate(100 110) scale(6.2) translate(-12 -12)" opacity="0.14" fill="none" stroke={a} strokeWidth="1.2" strokeLinejoin="miter"><path d={agent.emblem} /></g>
      <rect x="56" y="208" width="88" height="8" fill="#000" opacity="0.35" /><rect x="68" y="216" width="64" height="4" fill="#000" opacity="0.35" />
      <svg x="22" y="28" width="156" height="184" viewBox={`0 0 ${SW} ${SH}`} style={{ filter: locked ? 'grayscale(1) brightness(0.4)' : undefined }}>
        {runs.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1.02} fill={r.c} />)}
      </svg>
      <g transform="translate(150 16) scale(1.4)" fill="none" stroke={a} strokeWidth="1.6" strokeLinejoin="miter" strokeLinecap="square"><path d={agent.emblem} /></g>
      {locked && (
        <g transform="translate(70 84) scale(6)">
          {LOCK.flatMap((row, y) => [...row].map((ch, x) => ch === '#' ? <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill="#ff4655" /> : null))}
        </g>
      )}
    </svg>
  );
}
