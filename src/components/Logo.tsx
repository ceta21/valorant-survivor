export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={`logo ${small ? 'small' : ''}`} aria-label="VALORANT SURVIVORS">
      <svg viewBox="0 0 64 56" className="logo-mark" aria-hidden="true">
        <path d="M2 4 L22 4 L40 40 L30 40 Z" fill="#ff4655" />
        <path d="M62 4 L42 4 L26 36 L36 52 Z" fill="#ece8e1" />
      </svg>
      <div className="logo-text">
        <span className="logo-top">VALORANT</span>
        <span className="logo-bot">SURVIVORS</span>
      </div>
    </div>
  );
}
