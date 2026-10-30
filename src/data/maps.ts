import { MapDef } from '../game/types';

// Un único mundo grande con 4 zonas en cuadrícula de 2×2, separadas por abismos y unidas por portales
// (ver game/World.ts y game/MapArt.ts). Al empezar se elige en qué zona aparecer.
export const MAPS: MapDef[] = [
  {
    id: 'reino', name: 'Reino', desc: 'Praderas verdes con castillo, aldeas de tejado azul, bosques, estanques y caminos de piedra.', zone: [0, 0],
    colors: { ground: '#5a9a3e', ground2: '#6aaa48', wall: '#cfc4a8', wallTop: '#3a5ab0', accent: '#4fd0ff', light: '#ffe0a0' },
  },
  {
    id: 'glaciar', name: 'Glaciar', desc: 'Tierras heladas: castillo de hielo, lagos congelados, pinos nevados y cristales.', zone: [1, 0],
    colors: { ground: '#dfeaf6', ground2: '#cfdcec', wall: '#a8c4e0', wallTop: '#6a9ad0', accent: '#7ad7ff', light: '#c9f0ff' },
  },
  {
    id: 'infierno', name: 'Infierno', desc: 'Roca volcánica cruzada por ríos de lava, fortalezas con cuernos y pinchos de piedra.', zone: [0, 1],
    colors: { ground: '#4a2a24', ground2: '#56302a', wall: '#2a1a1a', wallTop: '#6a1a1a', accent: '#ff6a1c', light: '#ff8a3d' },
  },
  {
    id: 'ciudad', name: 'Ciudad', desc: 'Metrópolis moderna con rascacielos, avenidas, helipuertos, parques y un puerto.', zone: [1, 1],
    colors: { ground: '#6a7080', ground2: '#5e6474', wall: '#9aa4b4', wallTop: '#4a5466', accent: '#4fd0ff', light: '#ffe8a8' },
  },
];
export const MAP_BY_ID: Record<string, MapDef> = Object.fromEntries(MAPS.map(m => [m.id, m]));
/** Zona de inicio por defecto (y la que se usa si llega un mapa antiguo: Ascent, Bind o Haven). */
export const DEFAULT_MAP = 'reino';
export const mapOrDefault = (id: string) => MAP_BY_ID[id] ? id : DEFAULT_MAP;
