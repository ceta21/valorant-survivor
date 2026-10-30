# 10 · Datos del juego (generado)

> **No editar a mano.** Este fichero lo genera `scripts/docs-data.ts` a partir del código
> (`npm run docs:data`). Si cambias algún dato del juego, vuelve a generarlo.
>
> Última generación: 2026-10-30 · versión de Novedades: v1.20

## Agentes base

| id | Nombre | Rol | Vida | Velocidad | Daño | Coste | Rasgo | Modificadores |
|---|---|---|---|---|---|---|---|---|
| `zephyr` | Zephyr | Mago | 95 | 190 | 11 | gratis | Sabiduría arcana | area +0.15, cdr +0.1 |
| `lyra` | Lyra | Arquera | 90 | 205 | 10 | gratis | Ojo de halcón | range +0.2, crit +0.1 |
| `kael` | Kael | Caballero | 140 | 175 | 10 | gratis | Armadura pesada | maxShield +30, maxHp +20 |
| `vex` | Vex | Asesino | 85 | 210 | 11 | 900 | Sigilo | crit +0.15, critMul +0.4 |
| `sylvan` | Sylvan | Druida | 120 | 185 | 9 | 900 | Vínculo natural | regen +1, heal +0.2 |
| `ember` | Ember | Hechicera | 95 | 195 | 11 | 1000 | Llama interior | burn +3, regen +1 |
| `brutus` | Brutus | Berserker | 140 | 190 | 11 | 1000 | Sed de sangre | lifeOnKill +1, dmg +0.1 |
| `frost` | Frost | Hechicera | 100 | 190 | 10 | 1000 | Corazón helado | maxShield +15, area +0.1 |
| `seraph` | Seraph | Clériga | 115 | 185 | 9 | 1100 | Bendición | heal +0.4, maxShield +15 |
| `nox` | Nox | Hechicero | 100 | 190 | 11 | 1100 | Vacío | ult +0.2, dmg +0.1 |
| `raven` | Raven | Pistolero | 100 | 200 | 11 | 1100 | Gatillo rápido | aspd +0.15, crit +0.05 |
| `talos` | Talos | Guardián | 150 | 170 | 9 | 1200 | Piel de piedra | maxShield +40, maxHp +20 |
| `morgan` | Morgan | Necromante | 100 | 185 | 11 | 1200 | Pacto oscuro | lifeOnKill +1.2 |
| `volt` | Volt | Templario | 115 | 195 | 10 | 1200 | Sobrecarga | chain +1 |
| `grim` | Grim | Bárbaro | 135 | 185 | 12 | 1100 | Brutalidad | dmg +0.15, area +0.15 |
| `aqua` | Aqua | Sacerdotisa | 110 | 190 | 10 | 1100 | Marea | maxShield +20, regen +0.8 |
| `zahir` | Zahir | Explorador | 100 | 210 | 10 | 900 | Nómada | speed +25, magnet +0.2 |
| `draco` | Draco | Dragón | 130 | 180 | 12 | 1300 | Escamas | maxShield +20, burn +4 |
| `sora` | Sora | Ilusionista | 95 | 200 | 10 | 1000 | Engaño | cdr +0.15, crit +0.1 |
| `tink` | Tink | Ingeniera | 105 | 185 | 10 | 1200 | Ingenio | drones +1 |

Los agentes con coste 0 (Jett, Phoenix, Sage) están desbloqueados desde el principio.

## Habilidades por agente

| Agente | Espacio (especial) | E (secundaria) | Q (definitiva) |
|---|---|---|---|
| Zephyr | Haz arcano (`arcanebeam`, beam, 5 s) | Pulso arcano (`arcanepulse`, nova, 10 s) | Tormenta arcana (`arcanestorm`, beam) |
| Lyra | Flechas rastreadoras (`hunterdrone`, seekers, 7 s) | Disparo perforante (`piercingshot`, beam, 8 s) | Lluvia de flechas (`arrowrain`, strike) |
| Kael | Carga con escudo (`shieldcharge`, dash, 6 s) | Baluarte (`bulwark`, heal, 18 s) | Juicio del acero (`steeljudgement`, strike) |
| Vex | Paso sombrío (`shadowstep`, blink, 7 s) | Dagas sombrías (`shadowdaggers`, storm, 14 s) | Frenesí letal (`bladestorm`, storm) |
| Sylvan | Raíces (`roots`, nova, 9 s) | Renovación (`renewal`, heal, 16 s) | Bosque viviente (`livingforest`, nova) |
| Ember | Rayo de fuego (`firebeam`, beam, 5 s) | Llamarada (`flameblast`, cone, 9 s) | Lluvia de meteoritos (`orbitalstorm`, strike) |
| Brutus | Embestida (`wildcharge`, dash, 5 s) | Grito de guerra (`warcry`, frenzy, 16 s) | Furia (`rage`, frenzy) |
| Frost | Haz de hielo (`icebeam`, beam, 6 s) | Nova helada (`sloworb`, nova, 10 s) | Ventisca (`blizzard`, nova) |
| Seraph | Haz sagrado (`holybeam`, beam, 5 s) | Gran curación (`healorb`, heal, 14 s) | Luz divina (`divinelight`, nova) |
| Nox | Rayo del vacío (`voidbeam`, beam, 6 s) | Ojo del vacío (`voideye`, nova, 12 s) | Pesadilla (`nightmare`, nova) |
| Raven | Ráfaga (`fanfire`, frenzy, 12 s) | Rodar (`roll`, dash, 5 s) | Lluvia de balas (`leadrain`, strike) |
| Talos | Muro de tierra (`earthwall`, beam, 8 s) | Piel de roca (`stoneskin`, heal, 16 s) | Terremoto (`earthquake`, nova) |
| Morgan | Invocar espíritus (`raisespirits`, seekers, 8 s) | Drenar vida (`drainlife`, nova, 12 s) | Ejército de no muertos (`undeadarmy`, seekers) |
| Volt | Rayo (`lightningbeam`, beam, 5 s) | Campo eléctrico (`staticfield`, sprint, 14 s) | Tormenta eléctrica (`thunderstorm`, strike) |
| Grim | Torbellino (`whirlwind`, nova, 6 s) | Salto (`leap`, blink, 9 s) | Tajo devastador (`devastate`, strike) |
| Aqua | Ola (`wave`, beam, 7 s) | Curación de la marea (`tidecure`, heal, 15 s) | Maremoto (`tsunami`, nova) |
| Zahir | Ráfaga del desierto (`tailwind`, dash, 4.5 s) | Bomba de arena (`blastpack`, nova, 6 s) | Tormenta de arena (`sandstorm`, nova) |
| Draco | Aliento de fuego (`dragonbreath`, cone, 6 s) | Vuelo (`wingflight`, blink, 9 s) | Furia del dragón (`rematch`, nova) |
| Sora | Señuelo (`decoy`, nova, 9 s) | Desvanecer (`phase`, blink, 8 s) | Doble ilusorio (`mirrorself`, frenzy) |
| Tink | Torreta (`miniturret`, turret, 10 s) | Dron bombardero (`bombdrone`, strike, 8 s) | Escuadrón de robots (`robotsquad`, turret) |

### Parámetros de cada habilidad

| id | Nombre | Tipo | Recarga | Efecto visual | Parámetros | Descripción |
|---|---|---|---|---|---|---|
| `arcanebeam` | Haz arcano | beam | 5 s | scan | power=4, radius=460, width=26 | Haz de energía hacia delante que atraviesa a todos los enemigos. |
| `arcanepulse` | Pulso arcano | nova | 10 s | scan | power=3, radius=170, stun=0.8 | Onda arcana que daña y aturde 0.8 s a tu alrededor. |
| `hunterdrone` | Flechas rastreadoras | seekers | 7 s | arrow | power=5, count=4, mark=5 | 4 flechas teledirigidas que marcan (+30% daño recibido). |
| `piercingshot` | Disparo perforante | beam | 8 s | poison | power=6, radius=620, width=14 | Flecha cargada que atraviesa toda la línea de enemigos. |
| `shieldcharge` | Carga con escudo | dash | 6 s | wind | power=4, radius=220, invuln=0.3 | Embestida invulnerable que daña a lo que atraviesa. |
| `bulwark` | Baluarte | heal | 18 s | holy | power=0, heal=0.1, shield=40, invuln=1 | Gran escudo, algo de vida y 1 s de invulnerabilidad. |
| `shadowstep` | Paso sombrío | blink | 7 s | shadow | power=3, radius=240, count=120 | Te teletransportas y dañas al reaparecer. |
| `shadowdaggers` | Dagas sombrías | storm | 14 s | blades | power=1.6, duration=2.5 | 2.5 s lanzando dagas perforantes al enemigo más cercano. |
| `roots` | Raíces | nova | 9 s | poison | power=2, radius=200, slow=0.3, duration=3.5 | Raíces venenosas que dañan y ralentizan un 70% a tu alrededor. |
| `renewal` | Renovación | heal | 16 s | heal | power=0, heal=0.3, shield=15 | Recuperas 30% de vida y ganas escudo. |
| `firebeam` | Rayo de fuego | beam | 5 s | fire | power=4, radius=440, width=28, burn=6 | Rayo de fuego hacia delante que atraviesa e incendia. |
| `flameblast` | Llamarada | cone | 9 s | fire | power=4, radius=210, spread=70, burn=6 | Abanico de llamas delante de ti que incendia. |
| `wildcharge` | Embestida | dash | 5 s | wind | power=5, radius=240, invuln=0.25 | Embiste hacia delante dañando a todo lo que atraviesa. |
| `warcry` | Grito de guerra | frenzy | 16 s | stim | power=1.5, duration=5, heal=0.1 | 5 s: +50% cadencia y te curas un poco. |
| `icebeam` | Haz de hielo | beam | 6 s | ice | power=3.5, radius=440, width=26, slow=0.5, stun=0.4 | Haz helado que atraviesa, ralentiza y congela un instante. |
| `sloworb` | Nova helada | nova | 10 s | ice | power=1.5, radius=240, slow=0.4, duration=3.5 | Campo que daña y ralentiza un 60% a los enemigos. |
| `holybeam` | Haz sagrado | beam | 5 s | holy | power=4.5, radius=460, width=30 | Haz de luz hacia delante que atraviesa a los enemigos. |
| `healorb` | Gran curación | heal | 14 s | holy | power=0, heal=0.35, shield=20 | Recuperas 35% de vida y ganas escudo. |
| `voidbeam` | Rayo del vacío | beam | 6 s | gravity | power=4, radius=460, width=26, mark=5 | Rayo oscuro que atraviesa y marca (+30% daño recibido). |
| `voideye` | Ojo del vacío | nova | 12 s | paranoia | power=2, radius=220, stun=1, mark=4 | Ojo que aturde 1 s y marca a los enemigos cercanos. |
| `fanfire` | Ráfaga | frenzy | 12 s | stim | power=1.8, duration=4 | 4 s disparando un 80% más rápido. |
| `roll` | Rodar | dash | 5 s | wind | power=2, radius=180, invuln=0.3 | Rueda hacia delante, invulnerable un instante. |
| `earthwall` | Muro de tierra | beam | 8 s | stim | power=3, radius=300, width=64, stun=1 | Onda de tierra hacia delante que daña y aturde 1 s. |
| `stoneskin` | Piel de roca | heal | 16 s | stim | power=0, shield=50 | Gran escudo de piedra. |
| `raisespirits` | Invocar espíritus | seekers | 8 s | soul | power=5, count=4 | 4 espíritus que persiguen y atraviesan a los enemigos. |
| `drainlife` | Drenar vida | nova | 12 s | soul | power=3, radius=190, heal=0.15 | Roba vida a los enemigos cercanos y te cura. |
| `lightningbeam` | Rayo | beam | 5 s | electric | power=4, radius=460, width=24, stun=0.5 | Rayo hacia delante que atraviesa y aturde 0.5 s. |
| `staticfield` | Campo eléctrico | sprint | 14 s | electric | power=1.5, duration=5, radius=90 | 5 s rodeado de rayos que golpean a los enemigos cercanos. |
| `whirlwind` | Torbellino | nova | 6 s | boom | power=4, radius=160 | Gira con el hacha dañando a todo a tu alrededor. |
| `leap` | Salto | blink | 9 s | stim | power=3, radius=240, count=130, stun=0.8 | Saltas hacia delante y aturdes 0.8 s al caer. |
| `wave` | Ola | beam | 7 s | water | power=3.5, radius=320, width=70, slow=0.5 | Ola ancha hacia delante que daña y ralentiza un 50%. |
| `tidecure` | Curación de la marea | heal | 15 s | water | power=0, heal=0.25, shield=20 | Recuperas 25% de vida y ganas escudo. |
| `tailwind` | Ráfaga del desierto | dash | 4.5 s | wind | power=3, radius=200, invuln=0.25 | Impulso rápido e invulnerable que daña a lo que atraviesa. |
| `blastpack` | Bomba de arena | nova | 6 s | boom | power=4, radius=150 | Detonación inmediata a tu alrededor. |
| `dragonbreath` | Aliento de fuego | cone | 6 s | fire | power=5, radius=230, spread=80, burn=8 | Llamarada en abanico delante de ti que incendia. |
| `wingflight` | Vuelo | blink | 9 s | fire | power=3, radius=260, count=130 | Vuelas hacia delante y estallas en llamas al aterrizar. |
| `decoy` | Señuelo | nova | 9 s | paranoia | power=2, radius=200, stun=1 | Señuelo que estalla y aturde 1 s a los enemigos cercanos. |
| `phase` | Desvanecer | blink | 8 s | shadow | power=3, radius=240, count=110 | Te teletransportas y dañas al aparecer. |
| `miniturret` | Torreta | turret | 10 s | turret | power=1.6, count=1, duration=12 | Torreta que dispara a los enemigos durante 12 s (los robots pueden destruirla). |
| `bombdrone` | Dron bombardero | strike | 8 s | grenade | power=5, count=2, radius=100, delay=0.6 | 2 bombas que estallan sobre los enemigos. |
| `arcanestorm` | Tormenta arcana | beam | carga de definitiva | scan | power=6, count=8, radius=520, width=30 | 8 haces arcanos en todas direcciones. |
| `arrowrain` | Lluvia de flechas | strike | carga de definitiva | poison | power=6, count=14, radius=100, delay=0.6 | 14 flechas caen del cielo sobre los enemigos. |
| `steeljudgement` | Juicio del acero | strike | carga de definitiva | orbital | power=8, count=10, radius=120, delay=0.7 | 10 espadas de luz caen sobre los enemigos. |
| `bladestorm` | Frenesí letal | storm | carga de definitiva | blades | power=2.4, duration=7 | 7 s de lluvia de dagas perforantes de alto daño. |
| `livingforest` | Bosque viviente | nova | carga de definitiva | poison | power=6, radius=360, slow=0.4, duration=5, heal=0.3 | Gran bosque venenoso: daño, ralentización y curación. |
| `orbitalstorm` | Lluvia de meteoritos | strike | carga de definitiva | orbital | power=8, count=20, radius=140, delay=0.9 | 20 meteoritos devastadores. |
| `rage` | Furia | frenzy | carga de definitiva | stim | power=2.2, duration=9, heal=0.3, invuln=2 | 9 s de furia: +120% cadencia, curación e invulnerable 2 s. |
| `blizzard` | Ventisca | nova | carga de definitiva | ice | power=6, radius=380, stun=2, slow=0.4, duration=5 | Ventisca enorme que daña, aturde 2 s y ralentiza. |
| `divinelight` | Luz divina | nova | carga de definitiva | holy | power=4, radius=380, stun=2, heal=1, shield=60, invuln=2 | Cura el 100%, gran escudo, invulnerable 2 s y aturde en área. |
| `nightmare` | Pesadilla | nova | carga de definitiva | shadow | power=6, radius=380, stun=1.5, mark=6 | Oscuridad que daña, aturde 1.5 s y marca en un gran radio. |
| `leadrain` | Lluvia de balas | strike | carga de definitiva | boom | power=5, count=16, radius=80, delay=0.4 | 16 ráfagas que barren a los enemigos. |
| `earthquake` | Terremoto | nova | carga de definitiva | boom | power=6, radius=360, stun=2 | Terremoto enorme que daña y aturde 2 s. |
| `undeadarmy` | Ejército de no muertos | seekers | carga de definitiva | soul | power=6, count=14 | 14 espíritus que arrasan con todo. |
| `thunderstorm` | Tormenta eléctrica | strike | carga de definitiva | electric | power=7, count=14, radius=110, delay=0.5 | 14 rayos caen sobre los enemigos. |
| `devastate` | Tajo devastador | strike | carga de definitiva | boom | power=10, count=6, radius=160, delay=0.5 | 6 hachazos enormes sobre los enemigos. |
| `tsunami` | Maremoto | nova | carga de definitiva | water | power=7, radius=400, slow=0.4, duration=4 | Gran ola a tu alrededor que daña y ralentiza. |
| `sandstorm` | Tormenta de arena | nova | carga de definitiva | stim | power=5, radius=380, stun=1, slow=0.4, duration=5 | Tormenta que daña, aturde 1 s y ralentiza en un gran radio. |
| `rematch` | Furia del dragón | nova | carga de definitiva | fire | power=9, radius=360, burn=14, heal=0.6, invuln=1.5 | Explosión de fuego masiva, curación y 1.5 s de invulnerabilidad. |
| `mirrorself` | Doble ilusorio | frenzy | carga de definitiva | soul | power=1.7, duration=8, invuln=3 | 8 s: invulnerable 3 s y +70% cadencia. |
| `robotsquad` | Escuadrón de robots | turret | carga de definitiva | turret | power=2, count=3, duration=14 | 3 torretas reforzadas durante 14 s. |

## Agentes exclusivos (mercado nocturno)

| id | Nombre | Rol | Vida | Velocidad | Daño | Precio base | Rasgo | Kit por defecto |
|---|---|---|---|---|---|---|---|---|
| `eclipse` | Eclipse | Controladora | 115 | 190 | 11 | 42000 | Penumbra: area +0.15, cdr +0.1 | shadowstep / sloworb / orbitalstorm |
| `vortice` | Vórtice | Duelista | 100 | 212 | 11 | 38000 | Torbellino: speed +25, dmg +0.08 | tailwind / blastpack / bladestorm |
| `quimera` | Quimera | Iniciador | 125 | 185 | 10 | 45000 | Regeneración: regen +1.5, xp +0.1 | hunterdrone / healorb / rematch |

## Poderes

| id | Nombre | Rareza | Daño | Recarga (s) | Proyectiles | Perfora | Alcance | Crítico | Extra | Evolución (Nv 5) | Héroes que empiezan con él |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `arcano` | 🔮 Proyectil arcano | Común | 12 | 0.42 | 1 | 0 | 400 | 0.05 | — | Cometa arcano: +1 proyectil, +30% daño y atraviesa 1 enemigo | zephyr |
| `flecha` | 🏹 Flecha élfica | Poco común | 20 | 0.75 | 1 | 2 | 520 | 0.1 | — | Flecha del bosque: Dispara 3 flechas y atraviesan 2 enemigos más | lyra |
| `fuego` | 🔥 Bola de fuego | Común | 12 | 0.6 | 1 | 0 | 380 | 0 | quema 6/s | Infierno: +1 bola, +25% daño y estallan al impactar | ember, raven, draco |
| `rayo` | ⚡ Rayo | Poco común | 8 | 0.34 | 1 | 0 | 380 | 0.05 | encadena | Tormenta eléctrica: Dispara 2 rayos y +30% daño | volt, tink |
| `hoja` | 🍃 Hojas afiladas | Común | 9 | 0.6 | 3 | 0 | 340 | 0 | — | Vendaval de hojas: +3 hojas por lanzamiento | sylvan, quimera |
| `viento` | 🌪️ Cuchilla de viento | Poco común | 5 | 0.16 | 1 | 1 | 340 | 0.05 | — | Huracán: Atraviesa 1 enemigo más y +40% daño | vex, zahir, vortice |
| `sombra` | 👻 Esfera sombría | Poco común | 18 | 0.65 | 1 | 0 | 460 | 0.1 | persigue | Legión de almas: +2 almas por lanzamiento y +20% crítico | nox, morgan, sora, eclipse |
| `hielo` | ❄️ Fragmento de hielo | Común | 13 | 0.5 | 1 | 1 | 420 | 0.05 | — | Ventisca: +2 fragmentos y atraviesan 1 enemigo más | frost |
| `luz` | ✨ Lanza de luz | Épica | 26 | 0.95 | 1 | 99 | 600 | 0.2 | — | Juicio divino: Recarga 30% más rápida y estalla al impactar | kael, seraph |
| `roca` | 🪨 Roca | Poco común | 24 | 1 | 1 | 0 | 340 | 0 | explota 0.35 | Alud: +2 rocas y explosiones mayores | brutus, talos, grim |
| `agua` | 💧 Chorro de agua | Común | 7 | 0.42 | 2 | 1 | 380 | 0 | — | Maremoto: +2 chorros y +25% daño | aqua |

## Enemigos

| id | Nombre | Comportamiento | Vida | Velocidad | Daño | Radio | XP | Desde (s) | Peso | Patrones |
|---|---|---|---|---|---|---|---|---|---|---|
| `grunt` | Recluta | chase | 14 | 64 | 6 | 11 | 1 | 0 | 10 | — |
| `runner` | Corredor | chase | 9 | 118 | 7 | 9 | 1.4 | 55 | 5 | — |
| `tank` | Tanque | chase | 95 | 44 | 14 | 19 | 6 | 110 | 2.5 | — |
| `shooter` | Tirador | shooter | 16 | 56 | 7 | 11 | 2.2 | 85 | 3.5 | — |
| `exploder` | Explosivo | exploder | 12 | 92 | 26 | 11 | 2 | 140 | 3 | — |
| `elite` | Élite | elite | 260 | 62 | 20 | 17 | 22 | 200 | 0 | — |
| `boss1` | Centinela | boss | 1500 | 52 | 24 | 34 | 120 | 150 | 0 | slam, ring |
| `boss2` | Cazador | boss | 3600 | 58 | 28 | 38 | 220 | 300 | 0 | charge, ring, summon, slam |
| `boss3` | Titán | boss | 7000 | 54 | 32 | 44 | 360 | 450 | 0 | spiral, slam, charge, summon |
| `final` | Cabecilla del Protocolo | boss | 13000 | 60 | 36 | 52 | 1000 | 540 | 0 | ring, spiral, slam, charge, summon |
| `mortar` | Artillero | mortar | 26 | 48 | 16 | 12 | 2.8 | 120 | 2.4 | — |

Aparecen de forma normal: `grunt`, `runner`, `tank`, `shooter`, `exploder`, `mortar`. Los élites salen por calendario (desde el segundo 200).

## Calendario de la partida

| Segundo | Evento |
|---|---|
| 100 | Oleada intensa (anillo de enemigos alrededor del jugador) |
| 150 | Jefe: Centinela |
| 190 | Oleada intensa (anillo de enemigos alrededor del jugador) |
| 260 | Oleada intensa (anillo de enemigos alrededor del jugador) |
| 300 | Jefe: Cazador |
| 345 | Oleada intensa (anillo de enemigos alrededor del jugador) |
| 420 | Oleada intensa (anillo de enemigos alrededor del jugador) |
| 450 | Jefe: Titán |
| 490 | Oleada intensa (anillo de enemigos alrededor del jugador) |
| 540 | Jefe: Cabecilla del Protocolo |

- Jefe final a los 540 s; desde ahí empieza el **modo infinito**.
- Modo infinito: jefes al azar entre boss1, boss2, boss3, final; el primero a los 540 + 45 × dificultad s; el intervalo baja de 45 s hasta un mínimo de 14 s (× multiplicador de la dificultad); máximo 6 jefes vivos.

## Dificultades

| id | Nombre | Vida enemigos | Daño enemigos | Aparición | Intervalo de jefes | Créditos | Descripción |
|---|---|---|---|---|---|---|---|
| `facil` | Fácil | ×0.7 | ×0.6 | ×0.8 | ×1.3 | ×0.7 | Enemigos más débiles y menos numerosos. |
| `normal` | Normal | ×1 | ×1 | ×1 | ×1 | ×1 | La experiencia equilibrada. |
| `dificil` | Difícil | ×1.4 | ×1.35 | ×1.2 | ×0.8 | ×1.5 | Más vida, más daño y jefes más frecuentes. |
| `pesadilla` | Pesadilla | ×1.9 | ×1.8 | ×1.4 | ×0.6 | ×2.2 | Solo para los mejores. Cada golpe duele. |

## Mejoras de partida (al subir de nivel)

| id | Nombre | Común | Poco común | Épica | Legendaria | Peso | Máx. | Efecto (valor legendario) |
|---|---|---|---|---|---|---|---|---|
| `dmg` | Poder concentrado | 0.12 | 0.18 | 0.27 | 0.4 | 10 | ∞ | +40% de daño |
| `aspd` | Lanzamiento veloz | 0.1 | 0.15 | 0.22 | 0.32 | 10 | ∞ | +32% de velocidad de ataque |
| `move` | Botas de sprint | 0.08 | 0.12 | 0.18 | 0.26 | 7 | 6 | +26% de velocidad de movimiento |
| `range` | Visión lejana | 0.15 | 0.22 | 0.32 | 0.5 | 6 | 6 | +50% de alcance de proyectiles |
| `proj` | Poder duplicado | — | 1 | 1 | 2 | 5 | 5 | +2 proyectiles adicionales en todos tus poderes |
| `crit` | Ojo de halcón | 0.06 | 0.1 | 0.15 | 0.25 | 7 | ∞ | +25% de probabilidad de crítico |
| `area` | Carga expansiva | 0.12 | 0.2 | 0.3 | 0.45 | 6 | ∞ | +45% de radio de explosión y habilidades |
| `healing` | Matriz de curación | 0.15 | 0.25 | 0.4 | 0.6 | 5 | 5 | +60% de eficacia de curación |
| `cdr` | Circuitos de recarga | 0.06 | 0.1 | 0.15 | 0.22 | 7 | 6 | -22% de tiempo de recarga de habilidades |
| `healnow` | Kit de reparación | 0.15 | 0.25 | 0.4 | 0.7 | 5 | ∞ | Recuperas 70% de tu vida máxima |
| `maxhp` | Blindaje reforzado | 10 | 18 | 30 | 50 | 7 | ∞ | +50 de vida máxima |
| `xp` | Datos tácticos | 0.1 | 0.16 | 0.25 | 0.4 | 6 | 6 | +40% de experiencia obtenida |
| `chain` | Arco eléctrico | — | 1 | 1 | 2 | 4 | 5 | Los impactos saltan a 2 enemigos más (daño en cadena) |
| `pierce` | Poder perforante | 1 | 1 | 2 | 3 | 6 | 6 | Tus poderes atraviesan 3 enemigos más |
| `drone` | Dron auxiliar | — | — | 1 | 2 | 3 | 5 | +2 drones que orbita y dispara |
| `shield` | Escudo regenerativo | 10 | 18 | 30 | 50 | 5 | ∞ | +50 de escudo que se regenera fuera de combate |
| `killexp` | Eliminación explosiva | 0.4 | 0.6 | 1 | 1.6 | 5 | ∞ | Los enemigos explotan al morir (+19 de daño en área) |
| `regen` | Nanobots | 0.4 | 0.8 | 1.4 | 2.2 | 5 | ∞ | +2.2 de vida por segundo |
| `magnet` | Imán de orbes | 0.25 | 0.4 | 0.6 | 1 | 4 | 4 | +100% de radio de recogida |
| `burn` | Toque ígneo | — | 3 | 6 | 12 | 4 | 4 | Tus poderes incendian al enemigo (12 de daño/s) |
| `ult` | Carga rápida de definitiva | 0.15 | 0.25 | 0.4 | 0.6 | 4 | 4 | +60% de carga de la definitiva |
| `vamp` | Succión vital | 0.2 | 0.4 | 0.7 | 1.2 | 4 | 5 | Recuperas 1.2 de vida por eliminación |

## Mejoras permanentes

| id | Nombre | Por nivel | Máx. | Descripción |
|---|---|---|---|---|
| `dmg` | Daño | +3% | 10 | Daño de todos tus poderes y habilidades |
| `hp` | Vida | +5% | 10 | Vida máxima inicial |
| `speed` | Velocidad | +2% | 10 | Velocidad de movimiento |
| `xp` | Experiencia | +4% | 10 | Experiencia obtenida |

Coste del nivel siguiente: `round(80 × (nivel + 1)^1.6)` → 80, 243, 464, 735, 1051, 1406, 1800, 2229, 2691, 3185.

## Misiones y logros

| Tipo | id | Nombre | Condición | Recompensa |
|---|---|---|---|---|
| Misión | `m_kills_300` | Calentamiento | Elimina 300 enemigos en total | ◈ 80 |
| Misión | `m_kills_2000` | Cazarrecompensas | Elimina 2.000 enemigos en total | ◈ 250 |
| Misión | `m_time_300` | Superviviente | Sobrevive 5 minutos en una partida | ◈ 120 |
| Misión | `m_level_15` | Veterano | Alcanza el nivel 15 en una partida | ◈ 150 |
| Misión | `m_boss_5` | Rompejefes | Derrota 5 jefes en total | ◈ 200 |
| Misión | `m_win_1` | Ronda ganada | Gana una partida | ◈ 400 |
| Misión | `m_games_10` | Habitual | Juega 10 partidas | ◈ 150 |
| Logro | `a_first` | Primera sangre | Elimina a tu primer enemigo | — |
| Logro | `a_kills_1000` | Mil bajas | Acumula 1.000 eliminaciones | — |
| Logro | `a_kills_10000` | Máquina de guerra | Acumula 10.000 eliminaciones | — |
| Logro | `a_time_600` | Diez minutos | Sobrevive 10 minutos | — |
| Logro | `a_level_25` | Nivel 25 | Alcanza el nivel 25 en una partida | — |
| Logro | `a_win_3` | Imparable | Gana 3 partidas | — |
| Logro | `a_boss_1` | Jefe caído | Derrota a un jefe | — |
| Logro | `a_run_500` | Masacre | Elimina 500 enemigos en una partida | — |

## Mapas

| id | Nombre | Descripción |
|---|---|---|
| `reino` | Reino | Praderas verdes con castillo, aldeas de tejado azul, bosques, estanques y caminos de piedra. |
| `glaciar` | Glaciar | Tierras heladas: castillo de hielo, lagos congelados, pinos nevados y cristales. |
| `infierno` | Infierno | Roca volcánica cruzada por ríos de lava, fortalezas con cuernos y pinchos de piedra. |
| `ciudad` | Ciudad | Metrópolis moderna con rascacielos, avenidas, helipuertos, parques y un puerto. |

## Mercado nocturno

- 3 cartas por jugador, nueva rotación cada 24 h (medianoche UTC).
- Son los agentes exclusivos, en orden al azar.
- Descuento aleatorio del 10 % al 35 %; el precio se redondea a múltiplos de 50.

## Controles por defecto

| Acción | Tecla |
|---|---|
| Arriba | `KeyW` |
| Abajo | `KeyS` |
| Izquierda | `KeyA` |
| Derecha | `KeyD` |
| Habilidad principal | `Space` |
| Habilidad secundaria | `KeyE` |
| Definitiva | `KeyQ` |
| Pausa | `KeyP` |
| Relanzar mejoras | `KeyR` |
| Mapa | `KeyM` |

Siempre activas además: flechas (mover), Esc (pausa), 1/2/3 (elegir mejora).

## Historial de versiones (Novedades)

| Versión | Fecha | Título | Tipo |
|---|---|---|---|
| v1.20 | 2026-10-30 | Ahora somos ENDLESS RIFT | Nuevo |
| v1.19 | 2026-10-30 | Poderes en vez de armas | Nuevo |
| v1.18 | 2026-10-30 | Un mundo nuevo | Nuevo |
| v1.17 | 2026-10-30 | 20 héroes nuevos | Nuevo |
| v1.16 | 2026-10-29 | Tienda: estilos y mascotas | Nuevo |
| v1.15 | 2026-10-29 | Misiones diarias y racha | Nuevo |
| v1.14 | 2026-10-29 | Agentes disponibles | Mejora |
| v1.13 | 2026-10-29 | 14 agentes nuevos y nuevo aspecto | Nuevo |
| v1.12 | 2026-10-29 | Corrección del modo en pareja | Mejora |
| v1.11 | 2026-10-29 | Torretas de Killjoy | Mejora |
| v1.10 | 2026-10-28 | Idiomas y controles | Nuevo |
| v1.9 | 2026-10-28 | Nuevo enemigo: Artillero | Nuevo |
| v1.8 | 2026-10-28 | Nuevos robots enemigos | Mejora |
| v1.7 | 2026-10-28 | Jugar en pareja | Nuevo |
| v1.6 | 2026-10-28 | Mercado nocturno | Nuevo |
| v1.5 | 2026-10-28 | Cuentas de jugador | Nuevo |
| v1.4 | 2026-10-28 | Habilidades con nuevos efectos | Mejora |
| v1.3 | 2026-10-28 | Dificultades, modo infinito y ranking | Nuevo |
| v1.2 | 2026-10-28 | Nuevo estilo pixel art | Mejora |
| v1.1 | 2026-10-28 | Mapas infinitos | Mejora |
