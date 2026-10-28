import { MapDef } from '../game/types';

// Mapas 2D infinitos inspirados en la estética y la estructura de VALORANT (calles, sitios A/B/C, cobertura).
// El diseño se genera por código (ver game/World.ts y game/MapArt.ts); son originales: no reproducen los mapas oficiales.
export const MAPS: MapDef[] = [
  {
    id: 'ascent', name: 'Ascent', desc: 'Ciudad italiana infinita: tejados de terracota, calles de adoquín, plazas con fuente y sitios A/B.',
    colors: { ground: '#4a4f5c', ground2: '#565c6b', wall: '#d8c3a0', wallTop: '#c4623a', accent: '#4fd0e0', light: '#ffd9a0' },
  },
  {
    id: 'bind', name: 'Bind', desc: 'Bazar del desierto infinito: muros de adobe, patios, alfombras, sitios A/B y teletransportadores.',
    colors: { ground: '#c9945a', ground2: '#b9824c', wall: '#d98a4a', wallTop: '#f0b872', accent: '#2a9d8f', light: '#ff9a3d' },
  },
  {
    id: 'haven', name: 'Haven', desc: 'Monasterio de montaña infinito: templos de tejado rojo, jardines, estanques y sitios A/B/C.',
    colors: { ground: '#4f7a4f', ground2: '#5c8a5a', wall: '#8a3b3b', wallTop: '#c94c4c', accent: '#e8c35a', light: '#ffb347' },
  },
];
export const MAP_BY_ID: Record<string, MapDef> = Object.fromEntries(MAPS.map(m => [m.id, m]));
