// Dibujos de los bots y jefes recortados de art/enemigos.png (public/enemies/<id>.png, ver scripts/cut-enemies.ts).
// En el navegador se cargan solos la primera vez que hacen falta; fuera del navegador (capturas) se pueden dar con
// setEnemyArt. Mientras no hay dibujo, el Renderer pinta el robot hecho por código.
type Img = { width: number; height: number };
const art = new Map<string, Img | null>();
const flashes = new Map<string, any>();

export function setEnemyArt(id: string, img: Img) { art.set(id, img); }

/** Dibujo listo para pintar, o null si aún se está cargando (o no hay navegador). */
export function enemyArt(id: string): Img | null {
  if (art.has(id)) return art.get(id) ?? null;
  art.set(id, null);
  if (typeof Image === 'undefined') return null;
  const im = new Image();
  im.onload = () => art.set(id, im);
  im.src = `/enemies/${id}.png`;
  return null;
}

/** Silueta blanca del dibujo (para el destello al recibir un golpe), en caché. */
export function enemyFlash(id: string, img: Img, make: (w: number, h: number) => any) {
  let c = flashes.get(id);
  if (c) return c;
  c = make(img.width, img.height);
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, img.width, img.height);
  flashes.set(id, c);
  return c;
}

// Portales entre zonas recortados de art/portales.webp (public/portals/<zona>.png, ver scripts/cut-portals.ts): cada
// portal lleva el dibujo de la zona a la que va. Mientras no carga, el Renderer pinta el remolino hecho por código.
const portals = new Map<string, Img | null>();
export function setPortalArt(zone: string, img: Img) { portals.set(zone, img); }
export function portalArt(zone: string): Img | null {
  if (portals.has(zone)) return portals.get(zone) ?? null;
  portals.set(zone, null);
  if (typeof Image === 'undefined') return null;
  const im = new Image();
  im.onload = () => portals.set(zone, im);
  im.src = `/portals/${zone}.png`;
  return null;
}
