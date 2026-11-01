// Logo de ENDLESS RIFT (art/LOGO.png en redondo, ver scripts/make-icons.ts). En grande, el logo solo (ya lleva el
// nombre); en el menú, pequeño y con el nombre en letras pixeladas al lado.
export function Logo({ small = false, big = false }: { small?: boolean; big?: boolean }) {
  if (big) return <div className="logo big"><img className="logo-img" src="./icons/logo-320.png" alt="ENDLESS RIFT" width={320} height={320} /></div>;
  return (
    <div className={`logo ${small ? 'small' : ''}`} aria-label="ENDLESS RIFT">
      <img className="logo-mark" src="./icons/logo-128.png" alt="" width={128} height={128} aria-hidden="true" />
      <div className="logo-text">
        <span className="logo-top">ENDLESS</span>
        <span className="logo-bot">R<i>I</i>FT</span>
      </div>
    </div>
  );
}
