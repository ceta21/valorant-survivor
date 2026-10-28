import { AgentDef } from '../game/types';

/** Retrato original y estilizado (sin imágenes externas): silueta + visor + emblema del agente. */
export function AgentPortrait({ agent, locked = false }: { agent: AgentDef; locked?: boolean }) {
  const c = agent.color, a = agent.accent, id = agent.id;
  const gid = `bg-${id}`;
  return (
    <svg className="portrait" viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Retrato de ${agent.name}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c} stopOpacity="0.55" />
          <stop offset="1" stopColor="#0f1923" stopOpacity="1" />
        </linearGradient>
        <pattern id={`st-${id}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="5" height="14" fill="#fff" opacity="0.05" />
        </pattern>
      </defs>
      <rect width="200" height="240" fill={`url(#${gid})`} />
      <rect width="200" height="240" fill={`url(#st-${id})`} />
      <g transform="translate(100 112) scale(5.6) translate(-12 -12)" opacity="0.13" fill="none" stroke={a} strokeWidth="1.2" strokeLinejoin="round">
        <path d={agent.emblem} />
      </g>
      <g style={{ filter: locked ? 'grayscale(1) brightness(0.45)' : undefined }}>
        {/* variantes de silueta */}
        {id === 'jett' && <path d="M118 66 Q150 70 158 110 Q140 90 116 84 Z" fill={a} opacity="0.9" />}
        {id === 'killjoy' && <path d="M62 88 Q60 52 100 50 Q140 52 138 88" fill="none" stroke={a} strokeWidth="7" strokeLinecap="round" />}
        {id === 'omen' && <path d="M52 240 L58 120 Q100 40 142 120 L148 240 Z" fill="#0b1118" stroke={c} strokeWidth="2" />}
        {id === 'reyna' && <path d="M60 120 Q60 40 100 30 Q140 40 140 120 Z" fill="#150b1c" stroke={c} strokeWidth="2" />}
        {id === 'sage' && <path d="M58 120 Q58 46 100 44 Q142 46 142 120 Z" fill="#0f2a28" stroke={c} strokeWidth="2" />}
        {id === 'phoenix' && <path d="M78 62 Q84 34 100 22 Q116 34 122 62 Q110 52 100 56 Q90 52 78 62Z" fill={c} />}
        {/* hombros */}
        <path d="M24 240 Q30 150 100 142 Q170 150 176 240 Z" fill="#101820" stroke={c} strokeWidth="2.5" />
        <path d="M70 150 L100 176 L130 150" fill="none" stroke={a} strokeWidth="3" opacity="0.8" />
        <rect x="88" y="124" width="24" height="26" fill="#0c1218" />
        {/* cabeza */}
        <ellipse cx="100" cy="92" rx="30" ry="36" fill="#17212c" stroke={a} strokeWidth="2" />
        {/* visor */}
        <path d="M72 88 Q100 78 128 88 L124 102 Q100 96 76 102 Z" fill={c} />
        <path d="M72 88 Q100 78 128 88" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
        {id === 'raze' && (<g><circle cx="76" cy="52" r="11" fill="#101820" stroke={c} strokeWidth="2" /><circle cx="124" cy="52" r="11" fill="#101820" stroke={c} strokeWidth="2" /></g>)}
        {id === 'sova' && <path d="M66 70 Q100 40 134 70 L146 76 L54 76 Z" fill="#101820" stroke={c} strokeWidth="2.5" />}
        {id === 'brimstone' && (<g><path d="M66 70 Q100 44 134 70 L140 76 L60 76 Z" fill="#2a2118" stroke={c} strokeWidth="2.5" /><path d="M74 112 Q100 140 126 112 Q100 122 74 112Z" fill="#3a2d20" /></g>)}
        {id === 'neon' && <path d="M100 34 L92 56 H100 L96 74 L110 50 H102 L106 34Z" fill={c} />}
        {id === 'killjoy' && (<g><rect x="54" y="84" width="9" height="22" rx="4" fill="#101820" stroke={a} strokeWidth="2" /><rect x="137" y="84" width="9" height="22" rx="4" fill="#101820" stroke={a} strokeWidth="2" /></g>)}
      </g>
      <g transform="translate(150 18) scale(1.4)" fill="none" stroke={a} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        <path d={agent.emblem} />
      </g>
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
