import { AbilityDef, AgentDef } from '../game/types';

// Héroes originales del juego (dibujos en public/agents/<id>.png, recortados de art/heroes.png).
// Algunas habilidades conservan su id antiguo (tailwind, shadowstep, sloworb, orbitalstorm, blastpack,
// hunterdrone, healorb, rematch, bladestorm) porque las usan los kits de los agentes exclusivos.
export const AGENTS: AgentDef[] = [
  {
    id: 'zephyr', name: 'Zephyr', role: 'Mago', color: '#5c8bff', accent: '#c9d8ff', hp: 95, speed: 190, damage: 11, cost: 0,
    desc: 'Mago arcano. Lanza haces de energía que atraviesan filas enteras de robots.',
    trait: { label: 'Sabiduría arcana', desc: '+15% área y -10% recarga de habilidades', mods: { area: 0.15, cdr: 0.1 } },
    special: { id: 'arcanebeam', name: 'Haz arcano', desc: 'Haz de energía hacia delante que atraviesa a todos los enemigos.', kind: 'beam', cd: 5, power: 4, radius: 460, width: 26, color: '#5c8bff', fx: 'scan' },
    secondary: { id: 'arcanepulse', name: 'Pulso arcano', desc: 'Onda arcana que daña y aturde 0.8 s a tu alrededor.', kind: 'nova', cd: 10, power: 3, radius: 170, stun: 0.8, color: '#9ab8ff', fx: 'scan' },
    ultimate: { id: 'arcanestorm', name: 'Tormenta arcana', desc: '8 haces arcanos en todas direcciones.', kind: 'beam', cd: 0, power: 6, count: 8, radius: 520, width: 30, color: '#c9d8ff', fx: 'scan' },
    emblem: 'M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z',
  },
  {
    id: 'lyra', name: 'Lyra', role: 'Arquera', color: '#4ad66d', accent: '#d6ffe0', hp: 90, speed: 205, damage: 10, cost: 0,
    desc: 'Arquera élfica. Sus flechas persiguen a los robots y atraviesan todo lo que encuentran.',
    trait: { label: 'Ojo de halcón', desc: '+20% alcance y +10% crítico', mods: { range: 0.2, crit: 0.1 } },
    special: { id: 'hunterdrone', name: 'Flechas rastreadoras', desc: '4 flechas teledirigidas que marcan (+30% daño recibido).', kind: 'seekers', cd: 7, power: 5, count: 4, mark: 5, color: '#5dff9a', fx: 'arrow' },
    secondary: { id: 'piercingshot', name: 'Disparo perforante', desc: 'Flecha cargada que atraviesa toda la línea de enemigos.', kind: 'beam', cd: 8, power: 6, radius: 620, width: 14, color: '#9aff9a', fx: 'poison' },
    ultimate: { id: 'arrowrain', name: 'Lluvia de flechas', desc: '14 flechas caen del cielo sobre los enemigos.', kind: 'strike', cd: 0, power: 6, count: 14, radius: 100, delay: 0.6, color: '#5dff9a', fx: 'poison' },
    emblem: 'M4 20 L20 4 M14 4 L20 4 L20 10 M4 14 Q8 16 10 20',
  },
  {
    id: 'kael', name: 'Kael', role: 'Caballero', color: '#e04848', accent: '#ffd0c8', hp: 140, speed: 175, damage: 10, cost: 0,
    desc: 'Caballero de armadura pesada. Aguanta lo que le echen y carga contra la multitud.',
    trait: { label: 'Armadura pesada', desc: '+30 escudo y +20 vida', mods: { maxShield: 30, maxHp: 20 } },
    special: { id: 'shieldcharge', name: 'Carga con escudo', desc: 'Embestida invulnerable que daña a lo que atraviesa.', kind: 'dash', cd: 6, power: 4, radius: 220, invuln: 0.3, color: '#ff8a8a', fx: 'wind' },
    secondary: { id: 'bulwark', name: 'Baluarte', desc: 'Gran escudo, algo de vida y 1 s de invulnerabilidad.', kind: 'heal', cd: 18, power: 0, heal: 0.1, shield: 40, invuln: 1, color: '#ffe9a0', fx: 'holy' },
    ultimate: { id: 'steeljudgement', name: 'Juicio del acero', desc: '10 espadas de luz caen sobre los enemigos.', kind: 'strike', cd: 0, power: 8, count: 10, radius: 120, delay: 0.7, color: '#ffd24a', fx: 'orbital' },
    emblem: 'M12 2 L12 18 M8 6 L16 6 M10 18 L14 18 L12 22 Z',
  },
  {
    id: 'vex', name: 'Vex', role: 'Asesino', color: '#b05cff', accent: '#e2c4ff', hp: 85, speed: 210, damage: 11, cost: 900,
    desc: 'Asesino de las sombras. Aparece entre los robots y los acribilla con dagas.',
    trait: { label: 'Sigilo', desc: '+15% crítico y +40% daño crítico', mods: { crit: 0.15, critMul: 0.4 } },
    special: { id: 'shadowstep', name: 'Paso sombrío', desc: 'Te teletransportas y dañas al reaparecer.', kind: 'blink', cd: 7, power: 3, radius: 240, count: 120, color: '#b05cff', fx: 'shadow' },
    secondary: { id: 'shadowdaggers', name: 'Dagas sombrías', desc: '2.5 s lanzando dagas perforantes al enemigo más cercano.', kind: 'storm', cd: 14, power: 1.6, duration: 2.5, color: '#e2c4ff', fx: 'blades' },
    ultimate: { id: 'bladestorm', name: 'Frenesí letal', desc: '7 s de lluvia de dagas perforantes de alto daño.', kind: 'storm', cd: 0, power: 2.4, duration: 7, color: '#ffffff', fx: 'blades' },
    emblem: 'M5 19 L17 7 L19 5 L17 9 L7 21 Z M15 5 L19 9',
  },
  {
    id: 'sylvan', name: 'Sylvan', role: 'Druida', color: '#5dd66a', accent: '#d8ffc8', hp: 120, speed: 185, damage: 9, cost: 900,
    desc: 'Druida del bosque. Enreda a los robots con raíces y se cura con la naturaleza.',
    trait: { label: 'Vínculo natural', desc: '+1 vida/s y +20% curación', mods: { regen: 1, heal: 0.2 } },
    special: { id: 'roots', name: 'Raíces', desc: 'Raíces venenosas que dañan y ralentizan un 70% a tu alrededor.', kind: 'nova', cd: 9, power: 2, radius: 200, slow: 0.3, duration: 3.5, color: '#5dff9a', fx: 'poison' },
    secondary: { id: 'renewal', name: 'Renovación', desc: 'Recuperas 30% de vida y ganas escudo.', kind: 'heal', cd: 16, power: 0, heal: 0.3, shield: 15, color: '#4de0c0', fx: 'heal' },
    ultimate: { id: 'livingforest', name: 'Bosque viviente', desc: 'Gran bosque venenoso: daño, ralentización y curación.', kind: 'nova', cd: 0, power: 6, radius: 360, slow: 0.4, duration: 5, heal: 0.3, color: '#5dff9a', fx: 'poison' },
    emblem: 'M12 21 L12 9 M12 13 Q6 11 5 5 Q11 6 12 13 M12 11 Q18 9 19 3 Q13 4 12 11',
  },
  {
    id: 'ember', name: 'Ember', role: 'Hechicera', color: '#ff6a2e', accent: '#ffd0a8', hp: 95, speed: 195, damage: 11, cost: 1000,
    desc: 'Hechicera de fuego. Rayos y llamaradas que dejan a los robots ardiendo.',
    trait: { label: 'Llama interior', desc: 'Disparos incendiarios y +1 vida/s', mods: { burn: 3, regen: 1 } },
    special: { id: 'firebeam', name: 'Rayo de fuego', desc: 'Rayo de fuego hacia delante que atraviesa e incendia.', kind: 'beam', cd: 5, power: 4, radius: 440, width: 28, burn: 6, color: '#ff7a3d', fx: 'fire' },
    secondary: { id: 'flameblast', name: 'Llamarada', desc: 'Abanico de llamas delante de ti que incendia.', kind: 'cone', cd: 9, power: 4, radius: 210, spread: 70, burn: 6, color: '#ff7a3d', fx: 'fire' },
    ultimate: { id: 'orbitalstorm', name: 'Lluvia de meteoritos', desc: '20 meteoritos devastadores.', kind: 'strike', cd: 0, power: 8, count: 20, radius: 140, delay: 0.9, color: '#ffb02e', fx: 'orbital' },
    emblem: 'M12 3 C14 8 19 9 18 15 C17 19 14 21 12 21 C9 21 6 19 6 15 C6 11 10 10 12 3 Z',
  },
  {
    id: 'brutus', name: 'Brutus', role: 'Berserker', color: '#c8a070', accent: '#f0e0c0', hp: 140, speed: 190, damage: 11, cost: 1000,
    desc: 'Guerrero salvaje con piel de lobo. Cuanto más pelea, más fuerte se vuelve.',
    trait: { label: 'Sed de sangre', desc: '+1 vida por baja y +10% daño', mods: { lifeOnKill: 1, dmg: 0.1 } },
    special: { id: 'wildcharge', name: 'Embestida', desc: 'Embiste hacia delante dañando a todo lo que atraviesa.', kind: 'dash', cd: 5, power: 5, radius: 240, invuln: 0.25, color: '#f0e0c0', fx: 'wind' },
    secondary: { id: 'warcry', name: 'Grito de guerra', desc: '5 s: +50% cadencia y te curas un poco.', kind: 'frenzy', cd: 16, power: 1.5, duration: 5, heal: 0.1, color: '#ffb02e', fx: 'stim' },
    ultimate: { id: 'rage', name: 'Furia', desc: '9 s de furia: +120% cadencia, curación e invulnerable 2 s.', kind: 'frenzy', cd: 0, power: 2.2, duration: 9, heal: 0.3, invuln: 2, color: '#ff4655', fx: 'stim' },
    emblem: 'M6 4 Q4 12 8 20 M12 4 Q10 12 14 20 M18 4 Q16 12 20 20',
  },
  {
    id: 'frost', name: 'Frost', role: 'Hechicera', color: '#7ad7ff', accent: '#e6f7ff', hp: 100, speed: 190, damage: 10, cost: 1000,
    desc: 'Hechicera del hielo. Congela a los robots y los frena en seco.',
    trait: { label: 'Corazón helado', desc: '+15 escudo y +10% área', mods: { maxShield: 15, area: 0.1 } },
    special: { id: 'icebeam', name: 'Haz de hielo', desc: 'Haz helado que atraviesa, ralentiza y congela un instante.', kind: 'beam', cd: 6, power: 3.5, radius: 440, width: 26, slow: 0.5, stun: 0.4, color: '#7ab8ff', fx: 'ice' },
    secondary: { id: 'sloworb', name: 'Nova helada', desc: 'Campo que daña y ralentiza un 60% a los enemigos.', kind: 'nova', cd: 10, power: 1.5, radius: 240, slow: 0.4, duration: 3.5, color: '#7ab8ff', fx: 'ice' },
    ultimate: { id: 'blizzard', name: 'Ventisca', desc: 'Ventisca enorme que daña, aturde 2 s y ralentiza.', kind: 'nova', cd: 0, power: 6, radius: 380, stun: 2, slow: 0.4, duration: 5, color: '#c9e6ff', fx: 'ice' },
    emblem: 'M12 2 V22 M3 7 L21 17 M3 17 L21 7',
  },
  {
    id: 'seraph', name: 'Seraph', role: 'Clériga', color: '#ffd24a', accent: '#fff6c8', hp: 115, speed: 185, damage: 9, cost: 1100,
    desc: 'Clériga celestial. Purifica con haces de luz y protege con su bendición.',
    trait: { label: 'Bendición', desc: '+40% curación y +15 escudo', mods: { heal: 0.4, maxShield: 15 } },
    special: { id: 'holybeam', name: 'Haz sagrado', desc: 'Haz de luz hacia delante que atraviesa a los enemigos.', kind: 'beam', cd: 5, power: 4.5, radius: 460, width: 30, color: '#ffe9a0', fx: 'holy' },
    secondary: { id: 'healorb', name: 'Gran curación', desc: 'Recuperas 35% de vida y ganas escudo.', kind: 'heal', cd: 14, power: 0, heal: 0.35, shield: 20, color: '#ffe9a0', fx: 'holy' },
    ultimate: { id: 'divinelight', name: 'Luz divina', desc: 'Cura el 100%, gran escudo, invulnerable 2 s y aturde en área.', kind: 'nova', cd: 0, power: 4, radius: 380, stun: 2, heal: 1, shield: 60, invuln: 2, color: '#ffffff', fx: 'holy' },
    emblem: 'M12 2 V8 M12 16 V22 M2 12 H8 M16 12 H22 M12 9 A3 3 0 1 0 12.01 9',
  },
  {
    id: 'nox', name: 'Nox', role: 'Hechicero', color: '#8a3aff', accent: '#e2c4ff', hp: 100, speed: 190, damage: 11, cost: 1100,
    desc: 'Hechicero del vacío. Marca a los robots con su ojo y los devora con oscuridad.',
    trait: { label: 'Vacío', desc: '+20% carga de definitiva y +10% daño', mods: { ult: 0.2, dmg: 0.1 } },
    special: { id: 'voidbeam', name: 'Rayo del vacío', desc: 'Rayo oscuro que atraviesa y marca (+30% daño recibido).', kind: 'beam', cd: 6, power: 4, radius: 460, width: 26, mark: 5, color: '#9b5cff', fx: 'gravity' },
    secondary: { id: 'voideye', name: 'Ojo del vacío', desc: 'Ojo que aturde 1 s y marca a los enemigos cercanos.', kind: 'nova', cd: 12, power: 2, radius: 220, stun: 1, mark: 4, color: '#d946ef', fx: 'paranoia' },
    ultimate: { id: 'nightmare', name: 'Pesadilla', desc: 'Oscuridad que daña, aturde 1.5 s y marca en un gran radio.', kind: 'nova', cd: 0, power: 6, radius: 380, stun: 1.5, mark: 6, color: '#6b7cff', fx: 'shadow' },
    emblem: 'M3 12 Q12 4 21 12 Q12 20 3 12 M12 9 A3 3 0 1 0 12.01 9',
  },
  {
    id: 'raven', name: 'Raven', role: 'Pistolero', color: '#ff8a2e', accent: '#ffe0c0', hp: 100, speed: 200, damage: 11, cost: 1100,
    desc: 'Pistolero del oeste. El más rápido en desenfundar.',
    trait: { label: 'Gatillo rápido', desc: '+15% cadencia y +5% crítico', mods: { aspd: 0.15, crit: 0.05 } },
    special: { id: 'fanfire', name: 'Ráfaga', desc: '4 s disparando un 80% más rápido.', kind: 'frenzy', cd: 12, power: 1.8, duration: 4, color: '#ffb02e', fx: 'stim' },
    secondary: { id: 'roll', name: 'Rodar', desc: 'Rueda hacia delante, invulnerable un instante.', kind: 'dash', cd: 5, power: 2, radius: 180, invuln: 0.3, color: '#ffe0c0', fx: 'wind' },
    ultimate: { id: 'leadrain', name: 'Lluvia de balas', desc: '16 ráfagas que barren a los enemigos.', kind: 'strike', cd: 0, power: 5, count: 16, radius: 80, delay: 0.4, color: '#ffb02e', fx: 'boom' },
    emblem: 'M4 10 H18 L20 8 M8 10 V16 H12 L13 12',
  },
  {
    id: 'talos', name: 'Talos', role: 'Guardián', color: '#6aa84a', accent: '#d8f0c0', hp: 150, speed: 170, damage: 9, cost: 1200,
    desc: 'Gólem de piedra. Una muralla viviente que hace temblar la tierra.',
    trait: { label: 'Piel de piedra', desc: '+40 escudo y +20 vida', mods: { maxShield: 40, maxHp: 20 } },
    special: { id: 'earthwall', name: 'Muro de tierra', desc: 'Onda de tierra hacia delante que daña y aturde 1 s.', kind: 'beam', cd: 8, power: 3, radius: 300, width: 64, stun: 1, color: '#d9a066', fx: 'stim' },
    secondary: { id: 'stoneskin', name: 'Piel de roca', desc: 'Gran escudo de piedra.', kind: 'heal', cd: 16, power: 0, shield: 50, color: '#d9a066', fx: 'stim' },
    ultimate: { id: 'earthquake', name: 'Terremoto', desc: 'Terremoto enorme que daña y aturde 2 s.', kind: 'nova', cd: 0, power: 6, radius: 360, stun: 2, color: '#ffb02e', fx: 'boom' },
    emblem: 'M3 20 L9 9 L13 15 L16 11 L21 20 Z',
  },
  {
    id: 'morgan', name: 'Morgan', role: 'Necromante', color: '#a05cff', accent: '#e0c8ff', hp: 100, speed: 185, damage: 11, cost: 1200,
    desc: 'Necromante. Invoca espíritus que cazan robots y les roba la vida.',
    trait: { label: 'Pacto oscuro', desc: '+1.2 vida por baja', mods: { lifeOnKill: 1.2 } },
    special: { id: 'raisespirits', name: 'Invocar espíritus', desc: '4 espíritus que persiguen y atraviesan a los enemigos.', kind: 'seekers', cd: 8, power: 5, count: 4, color: '#d946ef', fx: 'soul' },
    secondary: { id: 'drainlife', name: 'Drenar vida', desc: 'Roba vida a los enemigos cercanos y te cura.', kind: 'nova', cd: 12, power: 3, radius: 190, heal: 0.15, color: '#d946ef', fx: 'soul' },
    ultimate: { id: 'undeadarmy', name: 'Ejército de no muertos', desc: '14 espíritus que arrasan con todo.', kind: 'seekers', cd: 0, power: 6, count: 14, color: '#ff9cff', fx: 'soul' },
    emblem: 'M7 10 A5 5 0 1 1 17 10 L17 15 L7 15 Z M9 10 A1 1 0 1 0 9.01 10 M15 10 A1 1 0 1 0 15.01 10 M10 19 V15 M14 19 V15',
  },
  {
    id: 'volt', name: 'Volt', role: 'Templario', color: '#4fa8ff', accent: '#c4faff', hp: 115, speed: 195, damage: 10, cost: 1200,
    desc: 'Templario del trueno. Sus rayos saltan de un robot a otro.',
    trait: { label: 'Sobrecarga', desc: 'Los disparos rebotan a 1 enemigo más', mods: { chain: 1 } },
    special: { id: 'lightningbeam', name: 'Rayo', desc: 'Rayo hacia delante que atraviesa y aturde 0.5 s.', kind: 'beam', cd: 5, power: 4, radius: 460, width: 24, stun: 0.5, color: '#2fe6ff', fx: 'electric' },
    secondary: { id: 'staticfield', name: 'Campo eléctrico', desc: '5 s rodeado de rayos que golpean a los enemigos cercanos.', kind: 'sprint', cd: 14, power: 1.5, duration: 5, radius: 90, color: '#2fe6ff', fx: 'electric' },
    ultimate: { id: 'thunderstorm', name: 'Tormenta eléctrica', desc: '14 rayos caen sobre los enemigos.', kind: 'strike', cd: 0, power: 7, count: 14, radius: 110, delay: 0.5, color: '#2fe6ff', fx: 'electric' },
    emblem: 'M13 2 L5 14 H11 L9 22 L19 9 H13 Z',
  },
  {
    id: 'grim', name: 'Grim', role: 'Bárbaro', color: '#ff5a3a', accent: '#ffd0c0', hp: 135, speed: 185, damage: 12, cost: 1100,
    desc: 'Bárbaro de las montañas. Su hacha no deja nada en pie.',
    trait: { label: 'Brutalidad', desc: '+15% daño y +15% área', mods: { dmg: 0.15, area: 0.15 } },
    special: { id: 'whirlwind', name: 'Torbellino', desc: 'Gira con el hacha dañando a todo a tu alrededor.', kind: 'nova', cd: 6, power: 4, radius: 160, color: '#ffd37a', fx: 'boom' },
    secondary: { id: 'leap', name: 'Salto', desc: 'Saltas hacia delante y aturdes 0.8 s al caer.', kind: 'blink', cd: 9, power: 3, radius: 240, count: 130, stun: 0.8, color: '#ffd37a', fx: 'stim' },
    ultimate: { id: 'devastate', name: 'Tajo devastador', desc: '6 hachazos enormes sobre los enemigos.', kind: 'strike', cd: 0, power: 10, count: 6, radius: 160, delay: 0.5, color: '#ff6a1c', fx: 'boom' },
    emblem: 'M7 21 L17 5 M12 4 Q20 4 20 12 L15 9 Z',
  },
  {
    id: 'aqua', name: 'Aqua', role: 'Sacerdotisa', color: '#4fb8ff', accent: '#c4fff8', hp: 110, speed: 190, damage: 10, cost: 1100,
    desc: 'Sacerdotisa de las mareas. Olas que frenan y aguas que curan.',
    trait: { label: 'Marea', desc: '+20 escudo y +0.8 vida/s', mods: { maxShield: 20, regen: 0.8 } },
    special: { id: 'wave', name: 'Ola', desc: 'Ola ancha hacia delante que daña y ralentiza un 50%.', kind: 'beam', cd: 7, power: 3.5, radius: 320, width: 70, slow: 0.5, color: '#4ff0e0', fx: 'water' },
    secondary: { id: 'tidecure', name: 'Curación de la marea', desc: 'Recuperas 25% de vida y ganas escudo.', kind: 'heal', cd: 15, power: 0, heal: 0.25, shield: 20, color: '#4ff0e0', fx: 'water' },
    ultimate: { id: 'tsunami', name: 'Maremoto', desc: 'Gran ola a tu alrededor que daña y ralentiza.', kind: 'nova', cd: 0, power: 7, radius: 400, slow: 0.4, duration: 4, color: '#4ff0e0', fx: 'water' },
    emblem: 'M3 14 Q7 9 11 14 Q15 19 19 14 Q21 12 21 10 M3 19 Q7 14 11 19',
  },
  {
    id: 'zahir', name: 'Zahir', role: 'Explorador', color: '#e0b04a', accent: '#fff0c0', hp: 100, speed: 210, damage: 10, cost: 900,
    desc: 'Explorador del desierto. Rápido como el viento y escurridizo como la arena.',
    trait: { label: 'Nómada', desc: '+25 velocidad y +20% radio de recogida', mods: { speed: 25, magnet: 0.2 } },
    special: { id: 'tailwind', name: 'Ráfaga del desierto', desc: 'Impulso rápido e invulnerable que daña a lo que atraviesa.', kind: 'dash', cd: 4.5, power: 3, radius: 200, invuln: 0.25, color: '#f4dcbc', fx: 'wind' },
    secondary: { id: 'blastpack', name: 'Bomba de arena', desc: 'Detonación inmediata a tu alrededor.', kind: 'nova', cd: 6, power: 4, radius: 150, color: '#ffd37a', fx: 'boom' },
    ultimate: { id: 'sandstorm', name: 'Tormenta de arena', desc: 'Tormenta que daña, aturde 1 s y ralentiza en un gran radio.', kind: 'nova', cd: 0, power: 5, radius: 380, stun: 1, slow: 0.4, duration: 5, color: '#d9a066', fx: 'stim' },
    emblem: 'M12 3 L21 20 H3 Z M12 10 L16 17 H8 Z',
  },
  {
    id: 'draco', name: 'Draco', role: 'Dragón', color: '#e04030', accent: '#ffc0a0', hp: 130, speed: 180, damage: 12, cost: 1300,
    desc: 'Dragón joven. Escupe fuego y vuela por encima del campo de batalla.',
    trait: { label: 'Escamas', desc: '+20 escudo y disparos incendiarios', mods: { maxShield: 20, burn: 4 } },
    special: { id: 'dragonbreath', name: 'Aliento de fuego', desc: 'Llamarada en abanico delante de ti que incendia.', kind: 'cone', cd: 6, power: 5, radius: 230, spread: 80, burn: 8, color: '#ff7a3d', fx: 'fire' },
    secondary: { id: 'wingflight', name: 'Vuelo', desc: 'Vuelas hacia delante y estallas en llamas al aterrizar.', kind: 'blink', cd: 9, power: 3, radius: 260, count: 130, color: '#ff7a3d', fx: 'fire' },
    ultimate: { id: 'rematch', name: 'Furia del dragón', desc: 'Explosión de fuego masiva, curación y 1.5 s de invulnerabilidad.', kind: 'nova', cd: 0, power: 9, radius: 360, burn: 14, heal: 0.6, invuln: 1.5, color: '#ff4a1c', fx: 'fire' },
    emblem: 'M4 18 Q6 8 14 6 L20 3 L18 9 Q16 16 8 18 Z M13 9 A1 1 0 1 0 13.01 9',
  },
  {
    id: 'sora', name: 'Sora', role: 'Ilusionista', color: '#c06aff', accent: '#f0d6ff', hp: 95, speed: 200, damage: 10, cost: 1000,
    desc: 'Ilusionista. Engaña a los robots con señuelos y desaparece cuando quiere.',
    trait: { label: 'Engaño', desc: '-15% recarga de habilidades y +10% crítico', mods: { cdr: 0.15, crit: 0.1 } },
    special: { id: 'decoy', name: 'Señuelo', desc: 'Señuelo que estalla y aturde 1 s a los enemigos cercanos.', kind: 'nova', cd: 9, power: 2, radius: 200, stun: 1, color: '#d946ef', fx: 'paranoia' },
    secondary: { id: 'phase', name: 'Desvanecer', desc: 'Te teletransportas y dañas al aparecer.', kind: 'blink', cd: 8, power: 3, radius: 240, count: 110, color: '#c06aff', fx: 'shadow' },
    ultimate: { id: 'mirrorself', name: 'Doble ilusorio', desc: '8 s: invulnerable 3 s y +70% cadencia.', kind: 'frenzy', cd: 0, power: 1.7, duration: 8, invuln: 3, color: '#ff9cff', fx: 'soul' },
    emblem: 'M12 3 A9 9 0 1 0 12.01 3 M12 7 A5 5 0 1 1 12.01 7',
  },
  {
    id: 'tink', name: 'Tink', role: 'Ingeniera', color: '#4fd0ff', accent: '#ffe0a0', hp: 105, speed: 185, damage: 10, cost: 1200,
    desc: 'Ingeniera inventora. Torretas, drones y robots amigos que luchan por ella.',
    trait: { label: 'Ingenio', desc: '+1 dron que dispara a tu alrededor', mods: { drones: 1 } },
    special: { id: 'miniturret', name: 'Torreta', desc: 'Torreta que dispara a los enemigos durante 12 s (los robots pueden destruirla).', kind: 'turret', cd: 10, power: 1.6, count: 1, duration: 12, color: '#ffe14a', fx: 'turret' },
    secondary: { id: 'bombdrone', name: 'Dron bombardero', desc: '2 bombas que estallan sobre los enemigos.', kind: 'strike', cd: 8, power: 5, count: 2, radius: 100, delay: 0.6, color: '#ffb02e', fx: 'grenade' },
    ultimate: { id: 'robotsquad', name: 'Escuadrón de robots', desc: '3 torretas reforzadas durante 14 s.', kind: 'turret', cd: 0, power: 2, count: 3, duration: 14, color: '#ffe14a', fx: 'turret' },
    emblem: 'M12 8 A4 4 0 1 0 12.01 8 M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5',
  },
];

/* ------------------------------------------------------------------ mercado nocturno */
// Habilidades disponibles para personalizar a los agentes exclusivos.
export const ABILITIES: AbilityDef[] = AGENTS.flatMap(a => [a.special, ...(a.secondary ? [a.secondary] : [])]);
export const ULTIMATES: AbilityDef[] = AGENTS.map(a => a.ultimate);
export const ABILITY_BY_ID: Record<string, AbilityDef> = Object.fromEntries([...ABILITIES, ...ULTIMATES].map(x => [x.id, x]));
/** De qué agente viene cada habilidad (para mostrarlo al elegir). */
export const ABILITY_OWNER: Record<string, string> = Object.fromEntries(AGENTS.flatMap(a => [a.special, a.secondary, a.ultimate].filter(Boolean).map(x => [x!.id, a.name])));

/** Personajes ORIGINALES que solo aparecen en el mercado nocturno. cost = precio base. */
export const EXCLUSIVE_AGENTS: AgentDef[] = [
  {
    id: 'eclipse', name: 'Eclipse', role: 'Controladora', color: '#9b7bff', accent: '#e2d6ff', hp: 115, speed: 190, damage: 11, cost: 42000, exclusive: true,
    desc: 'Guardiana de la penumbra. Combina los poderes que tú elijas con un dominio total del área.',
    trait: { label: 'Penumbra', desc: '+15% área de efecto y -10% recarga de habilidades', mods: { area: 0.15, cdr: 0.1 } },
    special: ABILITY_BY_ID.shadowstep, secondary: ABILITY_BY_ID.sloworb, ultimate: ABILITY_BY_ID.orbitalstorm,
    emblem: 'M15 4 A8 8 0 1 0 15 20 A6 6 0 1 1 15 4',
  },
  {
    id: 'vortice', name: 'Vórtice', role: 'Duelista', color: '#ff3d81', accent: '#ffd0e0', hp: 100, speed: 212, damage: 11, cost: 38000, exclusive: true,
    desc: 'Un torbellino imparable. Velocidad extrema y los poderes que tú elijas.',
    trait: { label: 'Torbellino', desc: '+25 velocidad y +8% daño', mods: { speed: 25, dmg: 0.08 } },
    special: ABILITY_BY_ID.tailwind, secondary: ABILITY_BY_ID.blastpack, ultimate: ABILITY_BY_ID.bladestorm,
    emblem: 'M4 12 Q12 2 20 12 Q12 22 4 12 M8 12 L16 12',
  },
  {
    id: 'quimera', name: 'Quimera', role: 'Iniciador', color: '#5dff9a', accent: '#d6ffe6', hp: 125, speed: 185, damage: 10, cost: 45000, exclusive: true,
    desc: 'Mitad bestia, mitad máquina. Resiste lo imposible y usa los poderes que tú elijas.',
    trait: { label: 'Regeneración', desc: '+1.5 vida por segundo y +10% experiencia', mods: { regen: 1.5, xp: 0.1 } },
    special: ABILITY_BY_ID.hunterdrone, secondary: ABILITY_BY_ID.healorb, ultimate: ABILITY_BY_ID.rematch,
    emblem: 'M4 20 L12 4 L20 20 Z M8 14 L16 14',
  },
];
export const ALL_AGENTS: AgentDef[] = [...AGENTS, ...EXCLUSIVE_AGENTS];
export const AGENT_BY_ID: Record<string, AgentDef> = Object.fromEntries(ALL_AGENTS.map(a => [a.id, a]));
/** Agentes que se pueden jugar ahora mismo (más los exclusivos del mercado); el resto sale con candado de "Próximamente". */
export const AVAILABLE_AGENTS = [...AGENTS.map(a => a.id), 'eclipse', 'vortice', 'quimera'];
export const isAvailable = (id: string) => AVAILABLE_AGENTS.includes(id);
/** Agentes de versiones anteriores que ya no existen y lo que costaban (se devuelven los créditos al cargar el guardado). */
export const LEGACY_AGENT_COSTS: Record<string, number> = {
  jett: 0, phoenix: 0, sage: 0, reyna: 500, raze: 500, sova: 500, neon: 900, omen: 900, killjoy: 900, brimstone: 1000,
  viper: 1000, cypher: 900, fade: 1000, breach: 1000, skye: 900, yoru: 1100, astra: 1100, kayo: 1100, chamber: 1200,
  harbor: 1100, iso: 1200, deadlock: 1200, gekko: 1000, tejo: 1300,
};
/** Agente con el que empezar si el último elegido no está disponible. */
export const playableAgent = (id: string) => isAvailable(id) ? id : AVAILABLE_AGENTS[0];

export interface Kit { special: string; secondary: string; ultimate: string }
/** Agente con las habilidades elegidas por el jugador (solo afecta a los exclusivos). */
export function withKit(agent: AgentDef, kit?: Kit): AgentDef {
  if (!agent.exclusive || !kit) return agent;
  return {
    ...agent,
    special: ABILITY_BY_ID[kit.special] ?? agent.special,
    secondary: ABILITY_BY_ID[kit.secondary] ?? agent.secondary,
    ultimate: ABILITY_BY_ID[kit.ultimate] ?? agent.ultimate,
  };
}
