import { useMemo } from 'react';
import { AgentDef } from '../game/types';
import { SW, SH, spriteRuns } from '../game/sprites';

/** Retrato: personaje pixel-art original del agente sobre un fondo con su emblema. */
export function AgentPortrait({ agent, locked = false }: { agent: AgentDef; locked?: boolean }) {
  const runs = useMemo(() => spriteRuns(agent.id), [agent.id]);
  const c = agent.color, a = agent.accent, id = agent.id;
  return (
    <svg className="portrait" viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Retrato de ${agent.name}`}>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.6" /><stop offset="1" stopColor="#0f1923" />
        </linearGradient>
        <pattern id={`st-${id}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="5" height="14" fill="#fff" opacity="0.05" />
        </pattern>
      </defs>
      <rect width="200" height="240" fill={`url(#bg-${id})`} />
      <rect width="200" height="240" fill={`url(#st-${id})`} />
      <g transform="translate(100 110) scale(6.2) translate(-12 -12)" opacity="0.14" fill="none" stroke={a} strokeWidth="1.2" strokeLinejoin="round"><path d={agent.emblem} /></g>
      <ellipse cx="100" cy="214" rx="52" ry="9" fill="#000" opacity="0.35" />
      <svg x="22" y="28" width="156" height="184" viewBox={`0 0 ${SW} ${SH}`} shapeRendering="crispEdges" style={{ filter: locked ? 'grayscale(1) brightness(0.4)' : undefined }}>
        {runs.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1.02} fill={r.c} />)}
      </svg>
      <g transform="translate(150 16) scale(1.4)" fill="none" stroke={a} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"><path d={agent.emblem} /></g>
      {locked && (
        <g transform="translate(100 120)">
          <rect x="-20" y="-6" width="40" height="32" rx="4" fill="#0f1923" stroke="#ff4655" strokeWidth="3" />
          <path d="M-12 -6 V-18 Q0 -34 12 -18 V-6" fill="none" stroke="#ff4655" strokeWidth="5" />
          <circle cx="0" cy="10" r="4" fill="#ff4655" />
        </g>
      )}
    </svg>
  );
}
