import { MapDef } from '../game/types';

const R = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

export const MAPS: MapDef[] = [
  {
    id: 'ascent', name: 'Ascent', desc: 'Calles urbanas y una plaza central con pilares.', width: 2400, height: 1800,
    colors: { ground: '#2a2f3a', ground2: '#323846', wall: '#8a6f55', wallTop: '#c4a07a', accent: '#4fd0e0', light: '#4fd0e0' },
    obstacles: [
      R(300, 260, 300, 180), R(760, 180, 140, 260), R(1500, 240, 360, 160), R(2000, 420, 200, 260),
      R(240, 700, 180, 300), R(620, 640, 200, 120), R(1740, 700, 220, 140), R(2060, 900, 180, 300),
      R(520, 1100, 260, 200), R(880, 1300, 180, 240), R(1420, 1220, 300, 160), R(1860, 1400, 340, 200),
      R(280, 1450, 220, 200), R(1000, 700, 50, 50), R(1350, 700, 50, 50), R(1000, 1050, 50, 50), R(1350, 1050, 50, 50),
    ],
    zones: [{ x: 470, y: 880, r: 150, label: 'A' }, { x: 1900, y: 1040, r: 150, label: 'B' }],
  },
  {
    id: 'bind', name: 'Bind', desc: 'Pasillos industriales en pleno desierto.', width: 2400, height: 1800,
    colors: { ground: '#3a2f27', ground2: '#46382d', wall: '#5b4a3e', wallTop: '#c98a52', accent: '#ff9a3d', light: '#ff9a3d' },
    obstacles: [
      R(240, 280, 360, 70), R(760, 200, 70, 300), R(1050, 300, 300, 90), R(1700, 240, 80, 320), R(1950, 380, 300, 80),
      R(300, 640, 80, 260), R(560, 760, 240, 80), R(1620, 680, 240, 80), R(2050, 760, 80, 260),
      R(420, 1140, 300, 80), R(900, 1220, 80, 260), R(1250, 1250, 340, 90), R(1800, 1160, 80, 300), R(2000, 1460, 300, 80),
      R(260, 1500, 80, 200), R(1000, 760, 70, 70), R(1330, 980, 70, 70), R(700, 1000, 60, 60), R(1500, 520, 60, 60),
    ],
    zones: [{ x: 470, y: 960, r: 150, label: 'A' }, { x: 1900, y: 960, r: 150, label: 'B' }],
    portals: [[{ x: 340, y: 430 }, { x: 2060, y: 1300 }], [{ x: 1200, y: 170 }, { x: 1200, y: 1620 }]],
  },
  {
    id: 'haven', name: 'Haven', desc: 'Patios y templos de un monasterio asiático.', width: 2400, height: 1800,
    colors: { ground: '#1f2d2a', ground2: '#263833', wall: '#6a3b3b', wallTop: '#d4584f', accent: '#ff6b6b', light: '#ffb347' },
    obstacles: [
      R(260, 240, 240, 240), R(700, 200, 200, 140), R(1100, 220, 200, 200), R(1560, 200, 260, 180), R(2000, 260, 220, 260),
      R(240, 720, 200, 200), R(680, 600, 140, 140), R(1640, 620, 140, 140), R(2040, 780, 200, 200),
      R(300, 1200, 260, 200), R(760, 1120, 160, 160), R(1480, 1150, 160, 160), R(1960, 1160, 240, 220),
      R(640, 1500, 220, 200), R(1100, 1440, 200, 260), R(1560, 1500, 260, 200),
    ],
    zones: [{ x: 540, y: 620, r: 130, label: 'A' }, { x: 1200, y: 1200, r: 130, label: 'B' }, { x: 1900, y: 540, r: 130, label: 'C' }],
  },
];
export const MAP_BY_ID: Record<string, MapDef> = Object.fromEntries(MAPS.map(m => [m.id, m]));
