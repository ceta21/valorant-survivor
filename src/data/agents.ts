import { AbilityDef, AgentDef } from '../game/types';

export const AGENTS: AgentDef[] = [
  {
    id: 'jett', name: 'Jett', role: 'Duelista', color: '#8fd9ff', accent: '#e6f7ff', hp: 90, speed: 205, damage: 10, cost: 0,
    desc: 'Ágil como el viento. Esquiva entre la multitud y castiga con tormentas de cuchillas.',
    trait: { label: 'Agilidad', desc: '+20 velocidad y +10% crítico', mods: { speed: 20, crit: 0.1 } },
    special: { id: 'tailwind', name: 'Viento de cola', desc: 'Impulso rápido e invulnerable que daña a lo que atraviesa.', kind: 'dash', cd: 4.5, power: 3, radius: 200, invuln: 0.25, color: '#8fd9ff', fx: 'wind' },
    secondary: { id: 'bladeburst', name: 'Ráfaga de cuchillas', desc: '2.5 s lanzando cuchillas perforantes al enemigo más cercano.', kind: 'storm', cd: 14, power: 1.6, duration: 2.5, color: '#bfeaff', fx: 'blades' },
    ultimate: { id: 'bladestorm', name: 'Tormenta de cuchillas', desc: '7 s de lluvia de cuchillas perforantes de alto daño.', kind: 'storm', cd: 0, power: 2.4, duration: 7, color: '#ffffff', fx: 'blades' },
    emblem: 'M3 9 Q12 3 21 9 M3 15 Q12 9 21 15',
  },
  {
    id: 'phoenix', name: 'Phoenix', role: 'Duelista', color: '#ff7a3d', accent: '#ffd0a8', hp: 110, speed: 190, damage: 10, cost: 0,
    desc: 'Controla el fuego. Quema enemigos y se recupera sobre el campo de batalla.',
    trait: { label: 'Llama viva', desc: '+1.2 vida/s y disparos incendiarios', mods: { regen: 1.2, burn: 3 } },
    special: { id: 'blaze', name: 'Llamarada', desc: 'Onda de fuego que daña e incendia a los enemigos cercanos.', kind: 'nova', cd: 8, power: 3.5, radius: 160, burn: 6, color: '#ff7a3d', fx: 'fire' },
    secondary: { id: 'hothands', name: 'Manos ardientes', desc: 'Absorbes el fuego: recuperas vida y ganas escudo.', kind: 'heal', cd: 20, power: 0, heal: 0.18, shield: 12, color: '#ffb36b', fx: 'hothands' },
    ultimate: { id: 'rematch', name: 'Rematch', desc: 'Explosión masiva, curación y 1.5 s de invulnerabilidad.', kind: 'nova', cd: 0, power: 9, radius: 360, burn: 14, heal: 0.6, invuln: 1.5, color: '#ff4a1c', fx: 'fire' },
    emblem: 'M12 3 C14 8 19 9 18 15 C17 19 14 21 12 21 C9 21 6 19 6 15 C6 11 10 10 12 3 Z',
  },
  {
    id: 'sage', name: 'Sage', role: 'Centinela', color: '#4de0c0', accent: '#c9fff1', hp: 130, speed: 180, damage: 9, cost: 0,
    desc: 'La más resistente. Cura, protege y ralentiza a quien se acerque.',
    trait: { label: 'Sanadora', desc: '+40% curación y +15 escudo', mods: { heal: 0.4, maxShield: 15 } },
    special: { id: 'healorb', name: 'Orbe curativo', desc: 'Recuperas 35% de vida y ganas escudo.', kind: 'heal', cd: 14, power: 0, heal: 0.35, shield: 20, color: '#4de0c0', fx: 'heal' },
    secondary: { id: 'sloworb', name: 'Orbe ralentizador', desc: 'Campo que daña y ralentiza un 60% a los enemigos.', kind: 'nova', cd: 10, power: 1.5, radius: 240, slow: 0.4, duration: 3.5, color: '#7ab8ff', fx: 'ice' },
    ultimate: { id: 'resurrection', name: 'Resurrección', desc: 'Cura el 100%, gran escudo, invulnerable 2 s y aturde en área.', kind: 'nova', cd: 0, power: 3, radius: 380, stun: 2, heal: 1, shield: 60, invuln: 2, color: '#ffffff', fx: 'holy' },
    emblem: 'M12 3 V21 M3 12 H21',
  },
  {
    id: 'reyna', name: 'Reyna', role: 'Duelista', color: '#d946ef', accent: '#f6c6ff', hp: 100, speed: 188, damage: 11, cost: 500,
    desc: 'Se alimenta de cada eliminación. Cuanto más mata, más fuerte se vuelve.',
    trait: { label: 'Devoradora', desc: '+1.2 vida por baja y +20% carga de definitiva', mods: { lifeOnKill: 1.2, ult: 0.2 } },
    special: { id: 'devour', name: 'Devorar', desc: '5 s de frenesí: +50% cadencia y mucha más vida robada por baja.', kind: 'frenzy', cd: 12, power: 1.5, duration: 5, heal: 0.08, color: '#d946ef', fx: 'soul' },
    ultimate: { id: 'empress', name: 'Emperatriz', desc: '12 s de frenesí: +90% cadencia y robo de vida masivo.', kind: 'frenzy', cd: 0, power: 1.9, duration: 12, heal: 0.25, invuln: 0.5, color: '#ff7bff', fx: 'soul' },
    emblem: 'M2 12 Q12 3 22 12 Q12 21 2 12 Z M12 9.5 A2.5 2.5 0 1 0 12.01 9.5',
  },
  {
    id: 'raze', name: 'Raze', role: 'Duelista', color: '#ffb02e', accent: '#ffe7b0', hp: 105, speed: 185, damage: 10, cost: 500,
    desc: 'Explosivos por todas partes. Daño en área devastador.',
    trait: { label: 'Demoledora', desc: '+25% radio de explosión y muertes explosivas', mods: { area: 0.25, killExplode: 0.4 } },
    special: { id: 'cluster', name: 'Granada de racimo', desc: '6 explosiones sobre los enemigos cercanos.', kind: 'strike', cd: 8, power: 4.5, count: 6, radius: 85, delay: 0.45, color: '#ffb02e', fx: 'grenade' },
    secondary: { id: 'blastpack', name: 'Paquete explosivo', desc: 'Detonación inmediata a tu alrededor.', kind: 'nova', cd: 6, power: 4, radius: 150, color: '#ffd37a', fx: 'boom' },
    ultimate: { id: 'showstopper', name: 'Showstopper', desc: 'Lluvia de 14 cohetes de gran daño.', kind: 'strike', cd: 0, power: 9, count: 14, radius: 125, delay: 0.5, color: '#ff6a1c', fx: 'rocket' },
    emblem: 'M12 2 L14 9 L21 7 L16 12 L21 17 L14 15 L12 22 L10 15 L3 17 L8 12 L3 7 L10 9 Z',
  },
  {
    id: 'sova', name: 'Sova', role: 'Iniciador', color: '#5c8bff', accent: '#c9d8ff', hp: 95, speed: 185, damage: 10, cost: 500,
    desc: 'Cazador a distancia. Proyectiles teledirigidos y marcado de objetivos.',
    trait: { label: 'Cazador', desc: '+25% alcance y +5% crítico', mods: { range: 0.25, crit: 0.05 } },
    special: { id: 'hunterdrone', name: 'Flechas rastreadoras', desc: '4 flechas teledirigidas que marcan (+30% daño recibido).', kind: 'seekers', cd: 7, power: 5, count: 4, mark: 5, color: '#5c8bff', fx: 'arrow' },
    secondary: { id: 'scan', name: 'Escáner', desc: 'Marca a todos los enemigos cercanos 7 s (+30% daño).', kind: 'nova', cd: 12, power: 0, radius: 460, mark: 7, color: '#9ec0ff', fx: 'scan' },
    ultimate: { id: 'hunterfury', name: 'Furia del cazador', desc: '10 flechas teledirigidas perforantes de daño enorme.', kind: 'seekers', cd: 0, power: 9, count: 10, mark: 6, color: '#ffffff', fx: 'arrow' },
    emblem: 'M12 3 L20 20 L12 16 L4 20 Z',
  },
  {
    id: 'neon', name: 'Neon', role: 'Duelista', color: '#2fe6ff', accent: '#c4faff', hp: 95, speed: 200, damage: 9, cost: 900,
    desc: 'Pura electricidad. Cadencia altísima y descargas encadenadas.',
    trait: { label: 'Alta tensión', desc: '+15% cadencia y 1 salto de cadena', mods: { aspd: 0.15, chain: 1 } },
    special: { id: 'sprint', name: 'Sprint eléctrico', desc: '5 s de velocidad +60% con aura eléctrica que daña.', kind: 'sprint', cd: 10, power: 1.6, radius: 75, duration: 5, color: '#2fe6ff', fx: 'electric' },
    ultimate: { id: 'overdrive', name: 'Sobrecarga', desc: '9 s de velocidad extrema con un aura devastadora.', kind: 'sprint', cd: 0, power: 3.2, radius: 125, duration: 9, color: '#ffffff', fx: 'electric' },
    emblem: 'M13 2 L5 13 H11 L9 22 L19 9 H13 Z',
  },
  {
    id: 'omen', name: 'Omen', role: 'Controlador', color: '#6b7cff', accent: '#d2d8ff', hp: 100, speed: 188, damage: 10, cost: 900,
    desc: 'Maestro de las sombras. Teletransporte corto y control de masas.',
    trait: { label: 'Sombra', desc: '-15% tiempo de recarga de habilidades', mods: { cdr: 0.15 } },
    special: { id: 'shadowstep', name: 'Paso en la sombra', desc: 'Te teletransportas y dañas al reaparecer.', kind: 'blink', cd: 7, power: 3, radius: 240, count: 120, color: '#6b7cff', fx: 'shadow' },
    secondary: { id: 'paranoia', name: 'Paranoia', desc: 'Onda que aturde 1.2 s y ralentiza.', kind: 'nova', cd: 13, power: 2, radius: 250, stun: 1.2, slow: 0.5, duration: 3, color: '#9aa6ff', fx: 'paranoia' },
    ultimate: { id: 'fromshadows', name: 'Desde las sombras', desc: 'Gran salto con explosión de sombra que aturde 2 s.', kind: 'blink', cd: 0, power: 8, radius: 440, count: 300, stun: 2, color: '#ffffff', fx: 'shadow' },
    emblem: 'M16 3 A9 9 0 1 0 21 14 A7 7 0 0 1 16 3 Z',
  },
  {
    id: 'killjoy', name: 'Killjoy', role: 'Centinela', color: '#ffe14a', accent: '#fff4b0', hp: 100, speed: 180, damage: 9, cost: 900,
    desc: 'La ingeniera. Torretas automáticas y un dron de apoyo desde el inicio.',
    trait: { label: 'Ingeniera', desc: 'Comienza con 1 dron auxiliar', mods: { drones: 1 } },
    special: { id: 'turret', name: 'Torreta', desc: 'Despliega 1 torreta durante 14 s. Los robots pueden destruirla.', kind: 'turret', cd: 9, power: 1.6, count: 1, duration: 14, color: '#ffe14a', fx: 'turret' },
    ultimate: { id: 'lockdown', name: 'Bloqueo', desc: 'Despliega 3 torretas de gran cadencia y más resistentes durante 14 s.', kind: 'turret', cd: 0, power: 2.6, count: 3, duration: 14, color: '#ffffff', fx: 'turret' },
    emblem: 'M12 2 L21 7 V17 L12 22 L3 17 V7 Z M12 9 V15',
  },
  {
    id: 'brimstone', name: 'Brimstone', role: 'Controlador', color: '#d9a066', accent: '#f4dcbc', hp: 120, speed: 178, damage: 11, cost: 1000,
    desc: 'El comandante. Bombardeos orbitales y estimulantes de combate.',
    trait: { label: 'Comandante', desc: '+15% radio de explosión y +10% daño', mods: { area: 0.15, dmg: 0.1 } },
    special: { id: 'orbital', name: 'Ataque orbital', desc: '3 bombardeos orbitales con retardo y gran radio.', kind: 'strike', cd: 10, power: 6, count: 3, radius: 125, delay: 1.0, color: '#d9a066', fx: 'orbital' },
    secondary: { id: 'stim', name: 'Estimulante', desc: '6 s de +35% de cadencia de disparo.', kind: 'frenzy', cd: 22, power: 1.35, duration: 6, color: '#f4dcbc', fx: 'stim' },
    ultimate: { id: 'orbitalstorm', name: 'Tormenta orbital', desc: '20 ataques orbitales devastadores.', kind: 'strike', cd: 0, power: 8, count: 20, radius: 140, delay: 0.9, color: '#ffffff', fx: 'orbital' },
    emblem: 'M12 3 A9 9 0 1 0 12.01 3 M12 7 A5 5 0 1 0 12.01 7',
  },
  // ---------------------------------------------------------------- agentes añadidos (habilidades inspiradas en su kit de VALORANT)
  {
    id: 'viper', name: 'Viper', role: 'Controladora', color: '#5dff9a', accent: '#c9ffd9', hp: 105, speed: 186, damage: 10, cost: 1000,
    desc: 'Química letal. Llena el campo de veneno que quema y ralentiza a los robots.',
    trait: { label: 'Toxina', desc: 'Disparos venenosos (+3 daño/s) y +10% área', mods: { burn: 3, area: 0.1 } },
    special: { id: 'snakebite', name: 'Mordedura de serpiente', desc: 'Lanza 3 frascos de ácido que estallan y dejan veneno.', kind: 'strike', cd: 8, power: 4, count: 3, radius: 90, delay: 0.6, color: '#5dff9a', fx: 'poison' },
    secondary: { id: 'toxicscreen', name: 'Pantalla tóxica', desc: 'Nube venenosa a tu alrededor que daña y ralentiza un 50%.', kind: 'nova', cd: 12, power: 1.8, radius: 230, slow: 0.5, duration: 3.5, color: '#3fbf5a', fx: 'poison' },
    ultimate: { id: 'viperspit', name: 'Foso de la víbora', desc: 'Gran nube tóxica: daño, quemadura y ralentización durante 6 s.', kind: 'nova', cd: 0, power: 6, radius: 380, burn: 10, slow: 0.5, duration: 6, color: '#5dff9a', fx: 'poison' },
    emblem: 'M12 3 C7 8 7 13 12 21 C17 13 17 8 12 3 M12 9 L12 15',
  },
  {
    id: 'cypher', name: 'Cypher', role: 'Centinela', color: '#c9e6ff', accent: '#ece6d6', hp: 100, speed: 184, damage: 10, cost: 900,
    desc: 'El informante. Cables trampa, jaulas de humo y ojos en todas partes.',
    trait: { label: 'Vigilancia', desc: '+20% alcance y +5% crítico', mods: { range: 0.2, crit: 0.05 } },
    special: { id: 'trapwire', name: 'Cable trampa', desc: 'Cables que aturden 1.5 s a los enemigos cercanos.', kind: 'nova', cd: 9, power: 1.5, radius: 180, stun: 1.5, color: '#c9e6ff', fx: 'wire' },
    secondary: { id: 'cybercage', name: 'Jaula cibernética', desc: 'Jaula de humo que daña y ralentiza un 50%.', kind: 'nova', cd: 12, power: 1.5, radius: 200, slow: 0.5, duration: 4, color: '#9ab0c8', fx: 'wire' },
    ultimate: { id: 'neuraltheft', name: 'Robo neural', desc: 'Revela y marca a todos los enemigos en un gran radio durante 8 s.', kind: 'nova', cd: 0, power: 3, radius: 560, mark: 8, color: '#4fd0ff', fx: 'scan' },
    emblem: 'M4 10 Q12 3 20 10 L4 10 Z M8 14 A2 2 0 1 0 8.01 14 M16 14 A2 2 0 1 0 16.01 14',
  },
  {
    id: 'fade', name: 'Fade', role: 'Iniciadora', color: '#e8445a', accent: '#ffc4cc', hp: 100, speed: 188, damage: 10, cost: 1000,
    desc: 'Cazadora de pesadillas. Sus criaturas persiguen y marcan a los robots.',
    trait: { label: 'Terror', desc: '+20% carga de definitiva y +10% experiencia', mods: { ult: 0.2, xp: 0.1 } },
    special: { id: 'prowler', name: 'Acechador', desc: '3 criaturas de sombra persiguen y marcan a los enemigos.', kind: 'seekers', cd: 8, power: 4, count: 3, mark: 4, color: '#e8445a', fx: 'arrow' },
    secondary: { id: 'seize', name: 'Captura', desc: 'Nudo de pesadilla que aturde 1.2 s y ralentiza.', kind: 'nova', cd: 12, power: 2, radius: 200, stun: 1.2, slow: 0.5, duration: 2, color: '#b05cff', fx: 'paranoia' },
    ultimate: { id: 'nightfall', name: 'Anochecer', desc: 'Ola de pesadilla que daña, marca y ralentiza en un gran radio.', kind: 'nova', cd: 0, power: 5, radius: 460, mark: 8, slow: 0.5, duration: 3, color: '#e8445a', fx: 'shadow' },
    emblem: 'M12 4 A8 8 0 1 0 12.01 4 M9 11 A1.5 1.5 0 1 0 9.01 11 M15 11 A1.5 1.5 0 1 0 15.01 11',
  },
  {
    id: 'breach', name: 'Breach', role: 'Iniciador', color: '#ffb02e', accent: '#ffe7b0', hp: 125, speed: 178, damage: 11, cost: 1000,
    desc: 'Brazos biónicos que hacen temblar la tierra. Terremotos que aturden a todo lo que pillan.',
    trait: { label: 'Brazos biónicos', desc: '+20% área y +5% daño', mods: { area: 0.2, dmg: 0.05 } },
    special: { id: 'aftershock', name: 'Réplica', desc: 'Carga explosiva que estalla tras un instante con gran daño.', kind: 'strike', cd: 7, power: 6, count: 1, radius: 110, delay: 0.7, color: '#ffb02e', fx: 'boom' },
    secondary: { id: 'faultline', name: 'Línea de falla', desc: 'Terremoto que aturde 1.5 s en área.', kind: 'nova', cd: 12, power: 2.5, radius: 260, stun: 1.5, color: '#ffb02e', fx: 'boom' },
    ultimate: { id: 'rollingthunder', name: 'Trueno ensordecedor', desc: 'Cadena de 10 terremotos devastadores.', kind: 'strike', cd: 0, power: 7, count: 10, radius: 120, delay: 0.4, color: '#ff6a1c', fx: 'boom' },
    emblem: 'M4 18 L9 8 L12 13 L15 6 L20 18 Z',
  },
  {
    id: 'skye', name: 'Skye', role: 'Iniciadora', color: '#9aff6a', accent: '#e2ffd0', hp: 105, speed: 190, damage: 9, cost: 900,
    desc: 'La fuerza de la naturaleza. Cura, explora con su tigre y lanza buscadores.',
    trait: { label: 'Naturaleza', desc: '+1 vida/s y +20% curación', mods: { regen: 1, heal: 0.2 } },
    special: { id: 'trailblazer', name: 'Explorador', desc: 'Tu tigre espiritual embiste a los enemigos que atraviesa.', kind: 'dash', cd: 6, power: 3.2, radius: 220, invuln: 0.25, color: '#9aff6a', fx: 'wind' },
    secondary: { id: 'regrowth', name: 'Rebrote', desc: 'Recuperas 30% de vida y ganas escudo.', kind: 'heal', cd: 16, power: 0, heal: 0.3, shield: 15, color: '#5dff9a', fx: 'heal' },
    ultimate: { id: 'seekers', name: 'Buscadores', desc: '5 buscadores que persiguen y marcan a los enemigos.', kind: 'seekers', cd: 0, power: 8, count: 5, mark: 6, color: '#9aff6a', fx: 'arrow' },
    emblem: 'M12 21 L12 9 M12 13 Q6 11 5 5 Q11 6 12 11 M12 11 Q18 8 19 3 Q13 5 12 9',
  },
  {
    id: 'yoru', name: 'Yoru', role: 'Duelista', color: '#4fa8ff', accent: '#c4e0ff', hp: 95, speed: 200, damage: 11, cost: 1100,
    desc: 'Rompe las dimensiones. Aparece donde no le esperan y engaña a los robots.',
    trait: { label: 'Dimensional', desc: '-10% recarga de habilidades y +10 velocidad', mods: { cdr: 0.1, speed: 10 } },
    special: { id: 'gatecrash', name: 'Irrupción', desc: 'Te teletransportas y dañas al aparecer.', kind: 'blink', cd: 7, power: 3, radius: 260, count: 120, color: '#4fa8ff', fx: 'shadow' },
    secondary: { id: 'fakeout', name: 'Engaño', desc: 'Señuelo que estalla y aturde 1 s a los enemigos cercanos.', kind: 'nova', cd: 11, power: 1.5, radius: 180, stun: 1, color: '#4fa8ff', fx: 'paranoia' },
    ultimate: { id: 'dimensionaldrift', name: 'Deriva dimensional', desc: '8 s fuera de esta dimensión: invulnerable 3 s y +70% cadencia.', kind: 'frenzy', cd: 0, power: 1.7, duration: 8, invuln: 3, heal: 0.1, color: '#4fa8ff', fx: 'soul' },
    emblem: 'M5 5 L19 19 M19 5 L5 19 M12 3 L12 21',
  },
  {
    id: 'astra', name: 'Astra', role: 'Controladora', color: '#b05cff', accent: '#ffd24a', hp: 100, speed: 182, damage: 10, cost: 1100,
    desc: 'Domina el cosmos. Pozos gravitatorios, pulsos que aturden y lluvias de estrellas.',
    trait: { label: 'Astral', desc: '+20% área y +10% carga de definitiva', mods: { area: 0.2, ult: 0.1 } },
    special: { id: 'gravitywell', name: 'Pozo gravitatorio', desc: 'Atrae y ralentiza a los enemigos, que quedan marcados.', kind: 'nova', cd: 9, power: 2, radius: 210, slow: 0.35, duration: 3, mark: 3, color: '#9b5cff', fx: 'gravity' },
    secondary: { id: 'novapulse', name: 'Pulso de nova', desc: 'Pulso cósmico que aturde 1.5 s.', kind: 'nova', cd: 12, power: 2, radius: 190, stun: 1.5, color: '#ffd24a', fx: 'gravity' },
    ultimate: { id: 'cosmicdivide', name: 'División cósmica', desc: '12 impactos astrales devastadores.', kind: 'strike', cd: 0, power: 7, count: 12, radius: 120, delay: 0.6, color: '#b05cff', fx: 'gravity' },
    emblem: 'M12 3 L14 10 L21 12 L14 14 L12 21 L10 14 L3 12 L10 10 Z',
  },
  {
    id: 'kayo', name: 'KAY/O', role: 'Iniciador', color: '#2fe6ff', accent: '#c4faff', hp: 120, speed: 184, damage: 10, cost: 1100,
    desc: 'Máquina de guerra. Suprime a los robots y se sobrecarga para seguir luchando.',
    trait: { label: 'Supresión', desc: '+5% crítico y +20 escudo', mods: { crit: 0.05, maxShield: 20 } },
    special: { id: 'fragment', name: 'FRAG/mento', desc: 'Granadas que explotan en área sobre los enemigos.', kind: 'strike', cd: 8, power: 5, count: 2, radius: 120, delay: 0.6, color: '#2fe6ff', fx: 'grenade' },
    secondary: { id: 'zeropoint', name: 'CERO/punto', desc: 'Cuchillo supresor: aturde 1 s y marca a los enemigos cercanos.', kind: 'nova', cd: 12, power: 2, radius: 300, stun: 1, mark: 5, color: '#2fe6ff', fx: 'electric' },
    ultimate: { id: 'nullcmd', name: 'NULO/orden', desc: 'Sobrecarga 10 s: +80% cadencia, escudo y curación.', kind: 'frenzy', cd: 0, power: 1.8, duration: 10, heal: 0.3, shield: 40, invuln: 1, color: '#2fe6ff', fx: 'stim' },
    emblem: 'M4 4 L20 4 L20 20 L4 20 Z M8 12 L16 12 M12 8 L12 16',
  },
  {
    id: 'chamber', name: 'Chamber', role: 'Centinela', color: '#d8b04a', accent: '#fff0b0', hp: 100, speed: 186, damage: 12, cost: 1200,
    desc: 'Elegancia letal. Disparos de precisión y teletransporte a su ancla.',
    trait: { label: 'Precisión', desc: '+15% crítico y +30% daño crítico', mods: { crit: 0.15, critMul: 0.3 } },
    special: { id: 'headhunter', name: 'Cazacabezas', desc: 'Ráfaga de disparos de precisión al enemigo más cercano.', kind: 'storm', cd: 9, power: 2.2, duration: 1.5, color: '#d8b04a', fx: 'blades' },
    secondary: { id: 'rendezvous', name: 'Encuentro', desc: 'Te teletransportas a tu ancla y dañas al llegar.', kind: 'blink', cd: 9, power: 2.5, radius: 260, count: 100, color: '#d8b04a', fx: 'holy' },
    ultimate: { id: 'tourdeforce', name: 'Golpe de gracia', desc: '6 disparos de francotirador teledirigidos y perforantes.', kind: 'seekers', cd: 0, power: 10, count: 6, mark: 4, color: '#ffd24a', fx: 'arrow' },
    emblem: 'M12 3 L20 9 L12 21 L4 9 Z M4 9 L20 9',
  },
  {
    id: 'harbor', name: 'Harbor', role: 'Controlador', color: '#4ff0e0', accent: '#c4fff8', hp: 110, speed: 184, damage: 10, cost: 1100,
    desc: 'El poder del agua antigua. Olas que frenan, burbujas que protegen y géiseres.',
    trait: { label: 'Marea', desc: '+20 escudo y +0.6 vida/s', mods: { maxShield: 20, regen: 0.6 } },
    special: { id: 'cascade', name: 'Cascada', desc: 'Ola de agua que daña y ralentiza un 50%.', kind: 'nova', cd: 9, power: 2, radius: 220, slow: 0.5, duration: 3, color: '#4ff0e0', fx: 'water' },
    secondary: { id: 'cove', name: 'Cala', desc: 'Burbuja protectora: gran escudo y algo de vida.', kind: 'heal', cd: 18, power: 0, heal: 0.12, shield: 40, color: '#4ff0e0', fx: 'water' },
    ultimate: { id: 'reckoning', name: 'Ajuste de cuentas', desc: 'Géiseres que golpean en cadena con gran daño.', kind: 'strike', cd: 0, power: 7, count: 10, radius: 115, delay: 0.5, color: '#4ff0e0', fx: 'water' },
    emblem: 'M3 14 Q7 9 11 14 Q15 19 19 14 Q21 12 21 12 M3 9 Q7 4 11 9 Q15 14 19 9',
  },
  {
    id: 'iso', name: 'Iso', role: 'Duelista', color: '#b98cff', accent: '#e8dcff', hp: 105, speed: 192, damage: 11, cost: 1200,
    desc: 'Asesino a sueldo. Se protege con energía, debilita a los robots y los reta a duelo.',
    trait: { label: 'Concentración', desc: '+0.8 vida por baja y +5% crítico', mods: { lifeOnKill: 0.8, crit: 0.05 } },
    special: { id: 'doubletap', name: 'Doble golpe', desc: 'Escudo de energía y +35% cadencia durante 5 s.', kind: 'frenzy', cd: 14, power: 1.35, duration: 5, shield: 25, color: '#b98cff', fx: 'soul' },
    secondary: { id: 'undercut', name: 'Socavar', desc: 'Rayo que hace vulnerables a los enemigos (+30% daño) 6 s.', kind: 'nova', cd: 10, power: 1.5, radius: 300, mark: 6, color: '#b98cff', fx: 'gravity' },
    ultimate: { id: 'killcontract', name: 'Contrato de muerte', desc: 'Arena de duelo: 10 s de frenesí con invulnerabilidad inicial.', kind: 'frenzy', cd: 0, power: 2, duration: 10, invuln: 1.5, heal: 0.2, color: '#7a4ad8', fx: 'soul' },
    emblem: 'M4 12 L12 4 L20 12 L12 20 Z M9 12 L15 12',
  },
  {
    id: 'deadlock', name: 'Deadlock', role: 'Centinela', color: '#e6e9ee', accent: '#9ab0c8', hp: 120, speed: 180, damage: 10, cost: 1200,
    desc: 'Nanohilo indestructible. Redes que frenan, barreras que protegen y capullos que atrapan.',
    trait: { label: 'Nanohilo', desc: '+15% área y +15 escudo', mods: { area: 0.15, maxShield: 15 } },
    special: { id: 'gravnet', name: 'Red gravitatoria', desc: 'Red que ralentiza un 60% y daña a los enemigos.', kind: 'nova', cd: 10, power: 1.5, radius: 220, slow: 0.4, duration: 3.5, color: '#9ab0c8', fx: 'wire' },
    secondary: { id: 'barriermesh', name: 'Malla barrera', desc: 'Barrera de nanohilo: gran escudo.', kind: 'heal', cd: 18, power: 0, shield: 50, color: '#e6e9ee', fx: 'wire' },
    ultimate: { id: 'annihilation', name: 'Aniquilación', desc: 'Nanohilos que atrapan y aturden 3 s en un gran radio.', kind: 'nova', cd: 0, power: 5, radius: 420, stun: 3, color: '#e6e9ee', fx: 'wire' },
    emblem: 'M4 4 L20 20 M20 4 L4 20 M4 12 L20 12 M12 4 L12 20',
  },
  {
    id: 'gekko', name: 'Gekko', role: 'Iniciador', color: '#c8ff3a', accent: '#efffc4', hp: 105, speed: 190, damage: 10, cost: 1000,
    desc: 'Sus criaturas luchan a su lado: Wingman dispara, Mosh revienta y Thrash embiste.',
    trait: { label: 'Compañeros', desc: '+15% experiencia y +30% radio de recogida', mods: { xp: 0.15, magnet: 0.3 } },
    special: { id: 'wingman', name: 'Wingman', desc: 'Wingman dispara a los enemigos durante 10 s (los robots pueden destruirlo).', kind: 'turret', cd: 9, power: 1.6, count: 1, duration: 10, color: '#c8ff3a', fx: 'turret' },
    secondary: { id: 'moshpit', name: 'Mosh Pit', desc: 'Charco que estalla con gran daño en área.', kind: 'strike', cd: 10, power: 6, count: 1, radius: 150, delay: 1, color: '#5dff9a', fx: 'poison' },
    ultimate: { id: 'thrash', name: 'Thrash', desc: 'Thrash embiste y estalla 6 veces sobre los enemigos.', kind: 'strike', cd: 0, power: 6, count: 6, radius: 110, delay: 0.5, color: '#c8ff3a', fx: 'poison' },
    emblem: 'M6 18 Q4 8 12 6 Q20 8 18 18 M9 12 A1.5 1.5 0 1 0 9.01 12 M15 12 A1.5 1.5 0 1 0 15.01 12',
  },
  {
    id: 'tejo', name: 'Tejo', role: 'Iniciador', color: '#ffb02e', accent: '#ffe7b0', hp: 115, speed: 182, damage: 11, cost: 1300,
    desc: 'Veterano de la guerra. Granadas adhesivas, misiles guiados y oleadas de explosiones.',
    trait: { label: 'Veterano', desc: '+15% área y +8% daño', mods: { area: 0.15, dmg: 0.08 } },
    special: { id: 'specialdelivery', name: 'Entrega especial', desc: 'Granadas adhesivas que estallan sobre los enemigos.', kind: 'strike', cd: 8, power: 5, count: 2, radius: 100, delay: 0.6, color: '#ffb02e', fx: 'grenade' },
    secondary: { id: 'guidedsalvo', name: 'Salva guiada', desc: '4 misiles guiados que estallan en área.', kind: 'strike', cd: 12, power: 5, count: 4, radius: 105, delay: 0.5, color: '#ff6a1c', fx: 'rocket' },
    ultimate: { id: 'armageddon', name: 'Armagedón', desc: 'Ola de 16 explosiones devastadoras.', kind: 'strike', cd: 0, power: 8, count: 16, radius: 120, delay: 0.5, color: '#ff6a1c', fx: 'orbital' },
    emblem: 'M12 3 L12 13 M8 9 L12 13 L16 9 M5 17 L19 17 M7 21 L17 21',
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
export const AVAILABLE_AGENTS = ['jett', 'phoenix', 'reyna', 'sage', 'killjoy', 'raze', 'eclipse', 'vortice', 'quimera'];
export const isAvailable = (id: string) => AVAILABLE_AGENTS.includes(id);
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
