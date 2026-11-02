// Ambiente de cada zona, pintado en pantalla encima del mundo (como el polvo ambiental): partículas propias y un tinte
// de luz suave. Reino: luciérnagas y hojas que caen. Glaciar: nieve. Infierno: ceniza que cae y ascuas que suben.
// Ciudad: lluvia en diagonal con salpicaduras. Las partículas se mueven con un poco de paralaje respecto a la cámara
// (están «más cerca» que el suelo) y son deterministas (no se guardan: se calculan con el tiempo y su índice).

type Ctx = CanvasRenderingContext2D;
const rnd = (s: number) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const wrap = (v: number, m: number) => ((v % m) + m) % m;

/** Tinte de luz de cada zona [r, g, b, opacidad] (mezcla normal, muy suave). */
export const ZONE_TINT: Record<string, [number, number, number, number]> = {
  reino: [255, 220, 150, 0.05],     // luz cálida de tarde
  glaciar: [140, 190, 255, 0.10],   // frío azulado
  infierno: [255, 70, 20, 0.09],    // brillo de lava
  ciudad: [30, 40, 90, 0.14],       // noche lluviosa
};

/** Tinte que va cambiando poco a poco al cruzar de zona (lo guarda el Renderer). */
export function blendTint(cur: number[], zone: string, dt: number) {
  const target = ZONE_TINT[zone] ?? [0, 0, 0, 0], k = Math.min(1, dt * 1.5);
  for (let i = 0; i < 4; i++) cur[i] += (target[i] - cur[i]) * k;
}

/**
 * Pinta el ambiente de la zona. `u` = tamaño de un píxel de juego en la pantalla; `vw`, `vh` = tamaño de la pantalla;
 * `cam` = posición de la cámara (para el paralaje); `low` = calidad baja (un tercio de partículas, sin brillos).
 */
export function drawWeather(g: Ctx, zone: string, t: number, camX: number, camY: number, vw: number, vh: number, u: number, low: boolean, tint: number[]) {
  // tinte de la zona
  if (tint[3] > 0.004) { g.fillStyle = `rgba(${tint[0] | 0},${tint[1] | 0},${tint[2] | 0},${tint[3].toFixed(3)})`; g.fillRect(0, 0, vw, vh); }
  const q = (n: number) => (low ? Math.ceil(n / 3) : n);
  const px = (x: number, y: number, s: number) => g.fillRect(Math.round(x / u) * u, Math.round(y / u) * u, s * u, s * u);
  const par = 0.35;   // paralaje: se desplazan un poco más que el suelo al moverse
  const ox = -camX * par * u * 0.5, oy = -camY * par * u * 0.5;

  if (zone === 'reino') {
    // luciérnagas: puntos amarillos que laten y vagan despacio
    for (let i = 0; i < q(26); i++) {
      const bx = rnd(i) * vw * 1.2, by = rnd(i + 50) * vh * 1.2;
      const x = wrap(bx + Math.sin(t * 0.7 + i) * 30 * u + ox, vw), y = wrap(by + Math.cos(t * 0.5 + i * 1.3) * 22 * u + oy, vh);
      const glow = 0.5 + 0.5 * Math.sin(t * 3 + i * 2.1);
      if (glow < 0.15) continue;
      if (!low) { g.fillStyle = `rgba(230,255,120,${(0.3 * glow).toFixed(3)})`; g.beginPath(); g.arc(x, y, 6 * u, 0, 7); g.fill(); }
      g.fillStyle = `rgba(250,255,170,${glow.toFixed(3)})`; px(x - u / 2, y - u / 2, 2);
    }
    // hojas que caen meciéndose
    for (let i = 0; i < q(14); i++) {
      const speed = 10 + rnd(i + 9) * 14, life = t * speed * u;
      const x = wrap(rnd(i + 3) * vw + Math.sin(t * 1.5 + i) * 16 * u + life * 0.4 + ox, vw), y = wrap(rnd(i + 7) * vh + life + oy, vh);
      g.fillStyle = ['#7ac14a', '#c8a040', '#e07a30'][i % 3];
      px(x, y, 2); if (Math.sin(t * 4 + i) > 0) px(x + u, y + u, 1);
    }
  } else if (zone === 'glaciar') {
    // nieve: copos de dos tamaños que caen con vaivén
    for (let i = 0; i < q(70); i++) {
      const big = i % 4 === 0, speed = (big ? 22 : 12) + rnd(i) * 10;
      const x = wrap(rnd(i + 11) * vw + Math.sin(t * 0.9 + i * 0.7) * 10 * u + t * 4 * u + ox * (big ? 1.4 : 0.8), vw);
      const y = wrap(rnd(i + 23) * vh + t * speed * u + oy * (big ? 1.4 : 0.8), vh);
      // sombra azulada para que se vea también sobre el suelo nevado
      g.fillStyle = 'rgba(70,100,150,0.55)'; px(x + u, y + u, big ? 2 : 1);
      g.fillStyle = big ? '#ffffff' : 'rgba(235,245,255,0.9)'; px(x, y, big ? 2 : 1);
    }
  } else if (zone === 'infierno') {
    // ceniza gris que cae despacio
    for (let i = 0; i < q(30); i++) {
      const x = wrap(rnd(i + 5) * vw + Math.sin(t * 0.6 + i) * 14 * u + ox, vw), y = wrap(rnd(i + 17) * vh + t * (6 + rnd(i) * 8) * u + oy, vh);
      g.fillStyle = 'rgba(150,140,140,0.55)'; px(x, y, 1);
    }
    // ascuas que suben parpadeando
    for (let i = 0; i < q(26); i++) {
      const speed = 14 + rnd(i + 31) * 20;
      const x = wrap(rnd(i + 41) * vw + Math.sin(t * 2 + i * 1.7) * 12 * u + ox, vw), y = wrap(rnd(i + 53) * vh - t * speed * u + oy, vh);
      const flick = 0.55 + 0.45 * Math.sin(t * 9 + i * 3);
      if (!low) { g.fillStyle = `rgba(255,120,30,${(0.25 * flick).toFixed(3)})`; g.beginPath(); g.arc(x, y, 3 * u, 0, 7); g.fill(); }
      g.fillStyle = flick > 0.7 ? '#ffd24a' : '#ff7a3d'; px(x, y, 1);
    }
  } else if (zone === 'ciudad') {
    // lluvia en diagonal (rayitas) y salpicaduras en el suelo
    g.fillStyle = 'rgba(190,215,255,0.6)';
    for (let i = 0; i < q(90); i++) {
      const speed = 260 + rnd(i) * 120;
      const x0 = wrap(rnd(i + 61) * vw - t * speed * 0.25 * u + ox * 1.5, vw), y0 = wrap(rnd(i + 71) * vh + t * speed * u + oy * 1.5, vh);
      for (let s = 0; s < 7; s++) g.fillRect(Math.round((x0 - s * 0.25 * u) / u) * u, Math.round((y0 - s * u) / u) * u, u, u);
    }
    for (let i = 0; i < q(10); i++) {
      const cycle = (t * 1.4 + rnd(i + 81)) % 1, k = cycle / 0.3;
      if (k > 1) continue;
      const x = rnd(i + Math.floor(t * 1.4 + rnd(i + 81)) * 13) * vw, y = rnd(i * 7 + Math.floor(t * 1.4 + rnd(i + 81)) * 5) * vh;
      g.fillStyle = `rgba(190,215,255,${(0.6 * (1 - k)).toFixed(3)})`;
      const r = (2 + k * 4) * u;
      g.fillRect(x - r, y, u, u); g.fillRect(x + r, y, u, u); g.fillRect(x, y - r * 0.5, u, u);
    }
  }
}
