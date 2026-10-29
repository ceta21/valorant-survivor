// Tienda: estilos de armas, estilos de agentes y mascotas. Los estilos son solo estéticos; las mascotas
// acompañan al jugador en la partida y, si se compra su poder, atacan con su elemento.

/** Colores de un estilo de arma (partes del dibujo: metal, oscuro, madera, brillo y detalle). */
export interface WeaponSkin { id: string; name: string; price: number; colors: { M: string; D: string; W: string; L: string; A: string } }
export const WEAPON_SKINS: WeaponSkin[] = [
  { id: 'ws_oro', name: 'Oro imperial', price: 4000, colors: { M: '#e8b84a', D: '#8a5a14', W: '#5a2a10', L: '#fff1b0', A: '#ff4655' } },
  { id: 'ws_dragon', name: 'Dragón carmesí', price: 5000, colors: { M: '#c4262e', D: '#3a0a10', W: '#1a1a1a', L: '#ff9a7a', A: '#ffd24a' } },
  { id: 'ws_glaciar', name: 'Glaciar', price: 3500, colors: { M: '#a8e4ff', D: '#2a5a7a', W: '#e6f6ff', L: '#ffffff', A: '#4fd0ff' } },
  { id: 'ws_toxico', name: 'Neón tóxico', price: 3500, colors: { M: '#3a3a44', D: '#16161c', W: '#2a2a32', L: '#9aff6a', A: '#5dff9a' } },
  { id: 'ws_vacio', name: 'Vacío', price: 4500, colors: { M: '#3a1a5a', D: '#120822', W: '#24103a', L: '#b98cff', A: '#ff3dd0' } },
  { id: 'ws_selva', name: 'Selva', price: 3000, colors: { M: '#5a6a3a', D: '#2a3420', W: '#6a4a2a', L: '#a8b878', A: '#ffb020' } },
];

/** Estilo de agente: recolorea la ropa y la armadura (respeta la piel y el contorno). Solo estético. */
export interface AgentSkin { id: string; name: string; desc: string; price: number; ramp: string[] }
export const AGENT_SKINS: AgentSkin[] = [
  { id: 'as_oro', name: 'Armadura dorada', desc: 'Armadura de oro pulido de pies a cabeza.', price: 12000, ramp: ['#3a2406', '#7a5414', '#c4902a', '#f0c850', '#fff2b0'] },
  { id: 'as_noche', name: 'Táctico nocturno', desc: 'Equipo de operaciones nocturnas en azul medianoche.', price: 9000, ramp: ['#0a0e1a', '#16203a', '#24365a', '#3a5a8a', '#7aa0d0'] },
  { id: 'as_carmesi', name: 'Carmesí', desc: 'Ropa de combate rojo sangre.', price: 9000, ramp: ['#1a0408', '#4a0a14', '#8a1424', '#d02a3a', '#ff8a8a'] },
  { id: 'as_glaciar', name: 'Glaciar', desc: 'Traje de alta montaña blanco y hielo.', price: 10000, ramp: ['#1a2a3a', '#4a6a8a', '#8ab0d0', '#cfe6f6', '#ffffff'] },
  { id: 'as_neon', name: 'Neón', desc: 'Ropa urbana con brillo eléctrico.', price: 11000, ramp: ['#12061e', '#3a0a5a', '#8a1aa8', '#e03ad8', '#7af6ff'] },
  { id: 'as_selva', name: 'Camuflaje de selva', desc: 'Uniforme verde para la jungla.', price: 8000, ramp: ['#0e1a0a', '#24361a', '#3e5a2a', '#6a8a3e', '#b0c87a'] },
];

/** Mascota: criatura original que acompaña al jugador. */
export interface PetDef {
  id: string; name: string; desc: string; price: number;
  element: 'fuego' | 'agua' | 'rayo' | 'planta' | 'hielo';
  /** Colores: cuerpo, cuerpo oscuro, tripa, mejillas y detalle del elemento. */
  colors: { body: string; dark: string; belly: string; cheek: string; fx: string; fx2: string };
  power: { name: string; desc: string };
}
export const PETS: PetDef[] = [
  { id: 'pet_brasin', name: 'Brasín', desc: 'Salamandra con una llama en la cabeza que nunca se apaga.', price: 15000, element: 'fuego',
    colors: { body: '#ff7a2e', dark: '#c44a14', belly: '#ffd48a', cheek: '#ff4655', fx: '#ffd24a', fx2: '#ff3d1a' },
    power: { name: 'Llamarada', desc: 'Escupe bolas de fuego que queman a los robots.' } },
  { id: 'pet_ajolin', name: 'Ajolín', desc: 'Ajolote juguetón que flota en una burbuja de agua.', price: 14000, element: 'agua',
    colors: { body: '#7ad0ff', dark: '#3a8ac4', belly: '#d8f4ff', cheek: '#ff8ac4', fx: '#4ff0e0', fx2: '#ffffff' },
    power: { name: 'Hidrochorro', desc: 'Chorros de agua que empujan y ralentizan.' } },
  { id: 'pet_voltio', name: 'Voltio', desc: 'Bichito eléctrico con antenas que chisporrotean.', price: 16000, element: 'rayo',
    colors: { body: '#ffe14a', dark: '#c49a14', belly: '#fff6c4', cheek: '#ff7a2e', fx: '#2fe6ff', fx2: '#ffffff' },
    power: { name: 'Chispazo', desc: 'Rayos que saltan entre varios enemigos.' } },
  { id: 'pet_broti', name: 'Brotín', desc: 'Conejito con un brote en la cabeza que crece al sol.', price: 12000, element: 'planta',
    colors: { body: '#7ad86a', dark: '#3e8a3a', belly: '#e2f6c4', cheek: '#ff8a8a', fx: '#2fa84a', fx2: '#c8ff6a' },
    power: { name: 'Hojas cortantes', desc: 'Lanza hojas afiladas y te cura un poco.' } },
  { id: 'pet_copito', name: 'Copito', desc: 'Búho de las nieves con cresta de cristal.', price: 14000, element: 'hielo',
    colors: { body: '#e6f2ff', dark: '#8ab0d0', belly: '#ffffff', cheek: '#8ad0ff', fx: '#7ad7ff', fx2: '#ffffff' },
    power: { name: 'Ventisca', desc: 'Fragmentos de hielo que congelan un instante.' } },
];
/** Precio de cada nivel del poder de la mascota (1, 2 y 3). */
export const PET_POWER_PRICES = [5000, 8000, 12000];
/** Segundos que tarda una mascota caída en volver. */
export const PET_RESPAWN = 60;

export const WEAPON_SKIN_BY_ID = Object.fromEntries(WEAPON_SKINS.map(s => [s.id, s])) as Record<string, WeaponSkin>;
export const AGENT_SKIN_BY_ID = Object.fromEntries(AGENT_SKINS.map(s => [s.id, s])) as Record<string, AgentSkin>;
export const PET_BY_ID = Object.fromEntries(PETS.map(p => [p.id, p])) as Record<string, PetDef>;

/** Lo comprado y lo que lleva puesto el jugador. */
export interface ShopSave {
  owned: string[];
  /** Estilo de arma equipado ('' = el original). */
  weapon: string;
  /** Estilo equipado en cada agente. */
  agent: Record<string, string>;
  /** Mascota que acompaña ('' = ninguna). */
  pet: string;
  /** Nivel del poder de cada mascota (0 = solo acompaña). */
  power: Record<string, number>;
}
export const emptyShop = (): ShopSave => ({ owned: [], weapon: '', agent: {}, pet: '', power: {} });

/** Aspecto que se lleva a la partida. */
export interface Looks { weapon?: string; agent?: string; pet?: string; petLv?: number }
export function looksFor(s: ShopSave, agentId: string): Looks {
  return { weapon: s.weapon || undefined, agent: s.agent[agentId] || undefined, pet: s.pet || undefined, petLv: s.pet ? s.power[s.pet] ?? 0 : 0 };
}
