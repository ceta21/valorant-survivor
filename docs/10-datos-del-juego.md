# 10 · Datos del juego (generado)

> **No editar a mano.** Este fichero lo genera `scripts/docs-data.ts` a partir del código
> (`npm run docs:data`). Si cambias algún dato del juego, vuelve a generarlo.
>
> Última generación: 2026-10-29 · versión de Novedades: v1.15

## Agentes base

| id | Nombre | Rol | Vida | Velocidad | Daño | Coste | Rasgo | Modificadores |
|---|---|---|---|---|---|---|---|---|
| `jett` | Jett | Duelista | 90 | 205 | 10 | gratis | Agilidad | speed +20, crit +0.1 |
| `phoenix` | Phoenix | Duelista | 110 | 190 | 10 | gratis | Llama viva | regen +1.2, burn +3 |
| `sage` | Sage | Centinela | 130 | 180 | 9 | gratis | Sanadora | heal +0.4, maxShield +15 |
| `reyna` | Reyna | Duelista | 100 | 188 | 11 | 500 | Devoradora | lifeOnKill +1.2, ult +0.2 |
| `raze` | Raze | Duelista | 105 | 185 | 10 | 500 | Demoledora | area +0.25, killExplode +0.4 |
| `sova` | Sova | Iniciador | 95 | 185 | 10 | 500 | Cazador | range +0.25, crit +0.05 |
| `neon` | Neon | Duelista | 95 | 200 | 9 | 900 | Alta tensión | aspd +0.15, chain +1 |
| `omen` | Omen | Controlador | 100 | 188 | 10 | 900 | Sombra | cdr +0.15 |
| `killjoy` | Killjoy | Centinela | 100 | 180 | 9 | 900 | Ingeniera | drones +1 |
| `brimstone` | Brimstone | Controlador | 120 | 178 | 11 | 1000 | Comandante | area +0.15, dmg +0.1 |
| `viper` | Viper | Controladora | 105 | 186 | 10 | 1000 | Toxina | burn +3, area +0.1 |
| `cypher` | Cypher | Centinela | 100 | 184 | 10 | 900 | Vigilancia | range +0.2, crit +0.05 |
| `fade` | Fade | Iniciadora | 100 | 188 | 10 | 1000 | Terror | ult +0.2, xp +0.1 |
| `breach` | Breach | Iniciador | 125 | 178 | 11 | 1000 | Brazos biónicos | area +0.2, dmg +0.05 |
| `skye` | Skye | Iniciadora | 105 | 190 | 9 | 900 | Naturaleza | regen +1, heal +0.2 |
| `yoru` | Yoru | Duelista | 95 | 200 | 11 | 1100 | Dimensional | cdr +0.1, speed +10 |
| `astra` | Astra | Controladora | 100 | 182 | 10 | 1100 | Astral | area +0.2, ult +0.1 |
| `kayo` | KAY/O | Iniciador | 120 | 184 | 10 | 1100 | Supresión | crit +0.05, maxShield +20 |
| `chamber` | Chamber | Centinela | 100 | 186 | 12 | 1200 | Precisión | crit +0.15, critMul +0.3 |
| `harbor` | Harbor | Controlador | 110 | 184 | 10 | 1100 | Marea | maxShield +20, regen +0.6 |
| `iso` | Iso | Duelista | 105 | 192 | 11 | 1200 | Concentración | lifeOnKill +0.8, crit +0.05 |
| `deadlock` | Deadlock | Centinela | 120 | 180 | 10 | 1200 | Nanohilo | area +0.15, maxShield +15 |
| `gekko` | Gekko | Iniciador | 105 | 190 | 10 | 1000 | Compañeros | xp +0.15, magnet +0.3 |
| `tejo` | Tejo | Iniciador | 115 | 182 | 11 | 1300 | Veterano | area +0.15, dmg +0.08 |

Los agentes con coste 0 (Jett, Phoenix, Sage) están desbloqueados desde el principio.

## Habilidades por agente

| Agente | Espacio (especial) | E (secundaria) | Q (definitiva) |
|---|---|---|---|
| Jett | Viento de cola (`tailwind`, dash, 4.5 s) | Ráfaga de cuchillas (`bladeburst`, storm, 14 s) | Tormenta de cuchillas (`bladestorm`, storm) |
| Phoenix | Llamarada (`blaze`, nova, 8 s) | Manos ardientes (`hothands`, heal, 20 s) | Rematch (`rematch`, nova) |
| Sage | Orbe curativo (`healorb`, heal, 14 s) | Orbe ralentizador (`sloworb`, nova, 10 s) | Resurrección (`resurrection`, nova) |
| Reyna | Devorar (`devour`, frenzy, 12 s) | — | Emperatriz (`empress`, frenzy) |
| Raze | Granada de racimo (`cluster`, strike, 8 s) | Paquete explosivo (`blastpack`, nova, 6 s) | Showstopper (`showstopper`, strike) |
| Sova | Flechas rastreadoras (`hunterdrone`, seekers, 7 s) | Escáner (`scan`, nova, 12 s) | Furia del cazador (`hunterfury`, seekers) |
| Neon | Sprint eléctrico (`sprint`, sprint, 10 s) | — | Sobrecarga (`overdrive`, sprint) |
| Omen | Paso en la sombra (`shadowstep`, blink, 7 s) | Paranoia (`paranoia`, nova, 13 s) | Desde las sombras (`fromshadows`, blink) |
| Killjoy | Torreta (`turret`, turret, 9 s) | — | Bloqueo (`lockdown`, turret) |
| Brimstone | Ataque orbital (`orbital`, strike, 10 s) | Estimulante (`stim`, frenzy, 22 s) | Tormenta orbital (`orbitalstorm`, strike) |
| Viper | Mordedura de serpiente (`snakebite`, strike, 8 s) | Pantalla tóxica (`toxicscreen`, nova, 12 s) | Foso de la víbora (`viperspit`, nova) |
| Cypher | Cable trampa (`trapwire`, nova, 9 s) | Jaula cibernética (`cybercage`, nova, 12 s) | Robo neural (`neuraltheft`, nova) |
| Fade | Acechador (`prowler`, seekers, 8 s) | Captura (`seize`, nova, 12 s) | Anochecer (`nightfall`, nova) |
| Breach | Réplica (`aftershock`, strike, 7 s) | Línea de falla (`faultline`, nova, 12 s) | Trueno ensordecedor (`rollingthunder`, strike) |
| Skye | Explorador (`trailblazer`, dash, 6 s) | Rebrote (`regrowth`, heal, 16 s) | Buscadores (`seekers`, seekers) |
| Yoru | Irrupción (`gatecrash`, blink, 7 s) | Engaño (`fakeout`, nova, 11 s) | Deriva dimensional (`dimensionaldrift`, frenzy) |
| Astra | Pozo gravitatorio (`gravitywell`, nova, 9 s) | Pulso de nova (`novapulse`, nova, 12 s) | División cósmica (`cosmicdivide`, strike) |
| KAY/O | FRAG/mento (`fragment`, strike, 8 s) | CERO/punto (`zeropoint`, nova, 12 s) | NULO/orden (`nullcmd`, frenzy) |
| Chamber | Cazacabezas (`headhunter`, storm, 9 s) | Encuentro (`rendezvous`, blink, 9 s) | Golpe de gracia (`tourdeforce`, seekers) |
| Harbor | Cascada (`cascade`, nova, 9 s) | Cala (`cove`, heal, 18 s) | Ajuste de cuentas (`reckoning`, strike) |
| Iso | Doble golpe (`doubletap`, frenzy, 14 s) | Socavar (`undercut`, nova, 10 s) | Contrato de muerte (`killcontract`, frenzy) |
| Deadlock | Red gravitatoria (`gravnet`, nova, 10 s) | Malla barrera (`barriermesh`, heal, 18 s) | Aniquilación (`annihilation`, nova) |
| Gekko | Wingman (`wingman`, turret, 9 s) | Mosh Pit (`moshpit`, strike, 10 s) | Thrash (`thrash`, strike) |
| Tejo | Entrega especial (`specialdelivery`, strike, 8 s) | Salva guiada (`guidedsalvo`, strike, 12 s) | Armagedón (`armageddon`, strike) |

### Parámetros de cada habilidad

| id | Nombre | Tipo | Recarga | Efecto visual | Parámetros | Descripción |
|---|---|---|---|---|---|---|
| `tailwind` | Viento de cola | dash | 4.5 s | wind | power=3, radius=200, invuln=0.25 | Impulso rápido e invulnerable que daña a lo que atraviesa. |
| `bladeburst` | Ráfaga de cuchillas | storm | 14 s | blades | power=1.6, duration=2.5 | 2.5 s lanzando cuchillas perforantes al enemigo más cercano. |
| `blaze` | Llamarada | nova | 8 s | fire | power=3.5, radius=160, burn=6 | Onda de fuego que daña e incendia a los enemigos cercanos. |
| `hothands` | Manos ardientes | heal | 20 s | hothands | power=0, heal=0.18, shield=12 | Absorbes el fuego: recuperas vida y ganas escudo. |
| `healorb` | Orbe curativo | heal | 14 s | heal | power=0, heal=0.35, shield=20 | Recuperas 35% de vida y ganas escudo. |
| `sloworb` | Orbe ralentizador | nova | 10 s | ice | power=1.5, radius=240, slow=0.4, duration=3.5 | Campo que daña y ralentiza un 60% a los enemigos. |
| `devour` | Devorar | frenzy | 12 s | soul | power=1.5, duration=5, heal=0.08 | 5 s de frenesí: +50% cadencia y mucha más vida robada por baja. |
| `cluster` | Granada de racimo | strike | 8 s | grenade | power=4.5, count=6, radius=85, delay=0.45 | 6 explosiones sobre los enemigos cercanos. |
| `blastpack` | Paquete explosivo | nova | 6 s | boom | power=4, radius=150 | Detonación inmediata a tu alrededor. |
| `hunterdrone` | Flechas rastreadoras | seekers | 7 s | arrow | power=5, count=4, mark=5 | 4 flechas teledirigidas que marcan (+30% daño recibido). |
| `scan` | Escáner | nova | 12 s | scan | power=0, radius=460, mark=7 | Marca a todos los enemigos cercanos 7 s (+30% daño). |
| `sprint` | Sprint eléctrico | sprint | 10 s | electric | power=1.6, radius=75, duration=5 | 5 s de velocidad +60% con aura eléctrica que daña. |
| `shadowstep` | Paso en la sombra | blink | 7 s | shadow | power=3, radius=240, count=120 | Te teletransportas y dañas al reaparecer. |
| `paranoia` | Paranoia | nova | 13 s | paranoia | power=2, radius=250, stun=1.2, slow=0.5, duration=3 | Onda que aturde 1.2 s y ralentiza. |
| `turret` | Torreta | turret | 9 s | turret | power=1.6, count=1, duration=14 | Despliega 1 torreta durante 14 s. Los robots pueden destruirla. |
| `orbital` | Ataque orbital | strike | 10 s | orbital | power=6, count=3, radius=125, delay=1 | 3 bombardeos orbitales con retardo y gran radio. |
| `stim` | Estimulante | frenzy | 22 s | stim | power=1.35, duration=6 | 6 s de +35% de cadencia de disparo. |
| `snakebite` | Mordedura de serpiente | strike | 8 s | poison | power=4, count=3, radius=90, delay=0.6 | Lanza 3 frascos de ácido que estallan y dejan veneno. |
| `toxicscreen` | Pantalla tóxica | nova | 12 s | poison | power=1.8, radius=230, slow=0.5, duration=3.5 | Nube venenosa a tu alrededor que daña y ralentiza un 50%. |
| `trapwire` | Cable trampa | nova | 9 s | wire | power=1.5, radius=180, stun=1.5 | Cables que aturden 1.5 s a los enemigos cercanos. |
| `cybercage` | Jaula cibernética | nova | 12 s | wire | power=1.5, radius=200, slow=0.5, duration=4 | Jaula de humo que daña y ralentiza un 50%. |
| `prowler` | Acechador | seekers | 8 s | arrow | power=4, count=3, mark=4 | 3 criaturas de sombra persiguen y marcan a los enemigos. |
| `seize` | Captura | nova | 12 s | paranoia | power=2, radius=200, stun=1.2, slow=0.5, duration=2 | Nudo de pesadilla que aturde 1.2 s y ralentiza. |
| `aftershock` | Réplica | strike | 7 s | boom | power=6, count=1, radius=110, delay=0.7 | Carga explosiva que estalla tras un instante con gran daño. |
| `faultline` | Línea de falla | nova | 12 s | boom | power=2.5, radius=260, stun=1.5 | Terremoto que aturde 1.5 s en área. |
| `trailblazer` | Explorador | dash | 6 s | wind | power=3.2, radius=220, invuln=0.25 | Tu tigre espiritual embiste a los enemigos que atraviesa. |
| `regrowth` | Rebrote | heal | 16 s | heal | power=0, heal=0.3, shield=15 | Recuperas 30% de vida y ganas escudo. |
| `gatecrash` | Irrupción | blink | 7 s | shadow | power=3, radius=260, count=120 | Te teletransportas y dañas al aparecer. |
| `fakeout` | Engaño | nova | 11 s | paranoia | power=1.5, radius=180, stun=1 | Señuelo que estalla y aturde 1 s a los enemigos cercanos. |
| `gravitywell` | Pozo gravitatorio | nova | 9 s | gravity | power=2, radius=210, slow=0.35, duration=3, mark=3 | Atrae y ralentiza a los enemigos, que quedan marcados. |
| `novapulse` | Pulso de nova | nova | 12 s | gravity | power=2, radius=190, stun=1.5 | Pulso cósmico que aturde 1.5 s. |
| `fragment` | FRAG/mento | strike | 8 s | grenade | power=5, count=2, radius=120, delay=0.6 | Granadas que explotan en área sobre los enemigos. |
| `zeropoint` | CERO/punto | nova | 12 s | electric | power=2, radius=300, stun=1, mark=5 | Cuchillo supresor: aturde 1 s y marca a los enemigos cercanos. |
| `headhunter` | Cazacabezas | storm | 9 s | blades | power=2.2, duration=1.5 | Ráfaga de disparos de precisión al enemigo más cercano. |
| `rendezvous` | Encuentro | blink | 9 s | holy | power=2.5, radius=260, count=100 | Te teletransportas a tu ancla y dañas al llegar. |
| `cascade` | Cascada | nova | 9 s | water | power=2, radius=220, slow=0.5, duration=3 | Ola de agua que daña y ralentiza un 50%. |
| `cove` | Cala | heal | 18 s | water | power=0, heal=0.12, shield=40 | Burbuja protectora: gran escudo y algo de vida. |
| `doubletap` | Doble golpe | frenzy | 14 s | soul | power=1.35, duration=5, shield=25 | Escudo de energía y +35% cadencia durante 5 s. |
| `undercut` | Socavar | nova | 10 s | gravity | power=1.5, radius=300, mark=6 | Rayo que hace vulnerables a los enemigos (+30% daño) 6 s. |
| `gravnet` | Red gravitatoria | nova | 10 s | wire | power=1.5, radius=220, slow=0.4, duration=3.5 | Red que ralentiza un 60% y daña a los enemigos. |
| `barriermesh` | Malla barrera | heal | 18 s | wire | power=0, shield=50 | Barrera de nanohilo: gran escudo. |
| `wingman` | Wingman | turret | 9 s | turret | power=1.6, count=1, duration=10 | Wingman dispara a los enemigos durante 10 s (los robots pueden destruirlo). |
| `moshpit` | Mosh Pit | strike | 10 s | poison | power=6, count=1, radius=150, delay=1 | Charco que estalla con gran daño en área. |
| `specialdelivery` | Entrega especial | strike | 8 s | grenade | power=5, count=2, radius=100, delay=0.6 | Granadas adhesivas que estallan sobre los enemigos. |
| `guidedsalvo` | Salva guiada | strike | 12 s | rocket | power=5, count=4, radius=105, delay=0.5 | 4 misiles guiados que estallan en área. |
| `bladestorm` | Tormenta de cuchillas | storm | carga de definitiva | blades | power=2.4, duration=7 | 7 s de lluvia de cuchillas perforantes de alto daño. |
| `rematch` | Rematch | nova | carga de definitiva | fire | power=9, radius=360, burn=14, heal=0.6, invuln=1.5 | Explosión masiva, curación y 1.5 s de invulnerabilidad. |
| `resurrection` | Resurrección | nova | carga de definitiva | holy | power=3, radius=380, stun=2, heal=1, shield=60, invuln=2 | Cura el 100%, gran escudo, invulnerable 2 s y aturde en área. |
| `empress` | Emperatriz | frenzy | carga de definitiva | soul | power=1.9, duration=12, heal=0.25, invuln=0.5 | 12 s de frenesí: +90% cadencia y robo de vida masivo. |
| `showstopper` | Showstopper | strike | carga de definitiva | rocket | power=9, count=14, radius=125, delay=0.5 | Lluvia de 14 cohetes de gran daño. |
| `hunterfury` | Furia del cazador | seekers | carga de definitiva | arrow | power=9, count=10, mark=6 | 10 flechas teledirigidas perforantes de daño enorme. |
| `overdrive` | Sobrecarga | sprint | carga de definitiva | electric | power=3.2, radius=125, duration=9 | 9 s de velocidad extrema con un aura devastadora. |
| `fromshadows` | Desde las sombras | blink | carga de definitiva | shadow | power=8, radius=440, count=300, stun=2 | Gran salto con explosión de sombra que aturde 2 s. |
| `lockdown` | Bloqueo | turret | carga de definitiva | turret | power=2.6, count=3, duration=14 | Despliega 3 torretas de gran cadencia y más resistentes durante 14 s. |
| `orbitalstorm` | Tormenta orbital | strike | carga de definitiva | orbital | power=8, count=20, radius=140, delay=0.9 | 20 ataques orbitales devastadores. |
| `viperspit` | Foso de la víbora | nova | carga de definitiva | poison | power=6, radius=380, burn=10, slow=0.5, duration=6 | Gran nube tóxica: daño, quemadura y ralentización durante 6 s. |
| `neuraltheft` | Robo neural | nova | carga de definitiva | scan | power=3, radius=560, mark=8 | Revela y marca a todos los enemigos en un gran radio durante 8 s. |
| `nightfall` | Anochecer | nova | carga de definitiva | shadow | power=5, radius=460, mark=8, slow=0.5, duration=3 | Ola de pesadilla que daña, marca y ralentiza en un gran radio. |
| `rollingthunder` | Trueno ensordecedor | strike | carga de definitiva | boom | power=7, count=10, radius=120, delay=0.4 | Cadena de 10 terremotos devastadores. |
| `seekers` | Buscadores | seekers | carga de definitiva | arrow | power=8, count=5, mark=6 | 5 buscadores que persiguen y marcan a los enemigos. |
| `dimensionaldrift` | Deriva dimensional | frenzy | carga de definitiva | soul | power=1.7, duration=8, invuln=3, heal=0.1 | 8 s fuera de esta dimensión: invulnerable 3 s y +70% cadencia. |
| `cosmicdivide` | División cósmica | strike | carga de definitiva | gravity | power=7, count=12, radius=120, delay=0.6 | 12 impactos astrales devastadores. |
| `nullcmd` | NULO/orden | frenzy | carga de definitiva | stim | power=1.8, duration=10, heal=0.3, shield=40, invuln=1 | Sobrecarga 10 s: +80% cadencia, escudo y curación. |
| `tourdeforce` | Golpe de gracia | seekers | carga de definitiva | arrow | power=10, count=6, mark=4 | 6 disparos de francotirador teledirigidos y perforantes. |
| `reckoning` | Ajuste de cuentas | strike | carga de definitiva | water | power=7, count=10, radius=115, delay=0.5 | Géiseres que golpean en cadena con gran daño. |
| `killcontract` | Contrato de muerte | frenzy | carga de definitiva | soul | power=2, duration=10, invuln=1.5, heal=0.2 | Arena de duelo: 10 s de frenesí con invulnerabilidad inicial. |
| `annihilation` | Aniquilación | nova | carga de definitiva | wire | power=5, radius=420, stun=3 | Nanohilos que atrapan y aturden 3 s en un gran radio. |
| `thrash` | Thrash | strike | carga de definitiva | poison | power=6, count=6, radius=110, delay=0.5 | Thrash embiste y estalla 6 veces sobre los enemigos. |
| `armageddon` | Armagedón | strike | carga de definitiva | orbital | power=8, count=16, radius=120, delay=0.5 | Ola de 16 explosiones devastadoras. |

## Agentes exclusivos (mercado nocturno)

| id | Nombre | Rol | Vida | Velocidad | Daño | Precio base | Rasgo | Kit por defecto |
|---|---|---|---|---|---|---|---|---|
| `eclipse` | Eclipse | Controladora | 115 | 190 | 11 | 42000 | Penumbra: area +0.15, cdr +0.1 | shadowstep / sloworb / orbitalstorm |
| `vortice` | Vórtice | Duelista | 100 | 212 | 11 | 38000 | Torbellino: speed +25, dmg +0.08 | tailwind / blastpack / bladestorm |
| `quimera` | Quimera | Iniciador | 125 | 185 | 10 | 45000 | Regeneración: regen +1.5, xp +0.1 | hunterdrone / healorb / rematch |

## Armas

| id | Nombre | Rareza | Daño | Recarga (s) | Proyectiles | Perfora | Alcance | Crítico | Explota | Evolución (Nv 5) |
|---|---|---|---|---|---|---|---|---|---|---|
| `classic` | Classic | Común | 10 | 0.42 | 1 | 0 | 380 | 0 | 0 | Classic Élite: +1 bala, +30% daño, atraviesa 1 enemigo |
| `vandal` | Vandal | Poco común | 24 | 0.8 | 1 | 0 | 440 | 0.05 | 0 | Vandal Tiranía: Atraviesa 2 enemigos más, +25% daño |
| `phantom` | Phantom | Poco común | 8 | 0.27 | 1 | 0 | 400 | 0 | 0 | Phantom Espectral: Dispara 2 balas por ráfaga |
| `spectre` | Spectre | Poco común | 5 | 0.14 | 1 | 0 | 330 | 0 | 0 | Spectre Enjambre: Proyectiles adicionales |
| `operator` | Operator | Épica | 70 | 1.7 | 1 | 99 | 640 | 0.1 | 0 | Operator Ejecutor: Recarga 30% más rápida y explota al impactar |
| `sheriff` | Sheriff | Poco común | 24 | 0.85 | 1 | 0 | 420 | 0.3 | 0 | Sheriff Dorado: +25% crítico y dispara 2 balas |
| `judge` | Judge | Poco común | 6 | 1 | 6 | 0 | 230 | 0 | 0 | Judge Aniquilador: +3 perdigones por disparo |
| `odin` | Odin | Épica | 5 | 0.09 | 1 | 0 | 360 | 0 | 0 | Odin Furia: Atraviesa 1 enemigo y +40% daño |
| `ares_inferno` | Ares Infernal | Legendaria · exclusiva | 7 | 0.07 | 1 | 0 | 380 | 0.05 | 0 | Ares Volcánico: Atraviesa 1 enemigo, +50% daño y balas explosivas |
| `marshal_vacio` | Marshal del Vacío | Legendaria · exclusiva | 58 | 0.95 | 1 | 99 | 720 | 0.35 | 0 | Marshal Singularidad: Recarga 25% más rápida y estalla al impactar |
| `bucky_tormenta` | Bucky Tormenta | Legendaria · exclusiva | 9 | 0.75 | 8 | 1 | 260 | 0.05 | 0 | Bucky Huracán: +4 perdigones con descarga explosiva |
| `guardian_aurora` | Guardian Aurora | Legendaria · exclusiva | 30 | 0.55 | 1 | 2 | 520 | 0.15 | 0 | Guardian Boreal: +40% daño y atraviesa 2 enemigos más |
| `frenzy_cosmos` | Frenzy Cósmico | Legendaria · exclusiva | 7 | 0.12 | 2 | 0 | 360 | 0.1 | 0 | Frenzy Supernova: +2 balas por disparo y +20% crítico |
| `bulldog_draco` | Bulldog Dracónico | Legendaria · exclusiva | 14 | 0.22 | 1 | 1 | 440 | 0.1 | 0.2 | Bulldog Ancestral: +1 bala, +30% daño y explosiones mayores |

Armas exclusivas: precio base en el mercado → Ares Infernal ◈12000, Marshal del Vacío ◈14000, Bucky Tormenta ◈10000, Guardian Aurora ◈11000, Frenzy Cósmico ◈9000, Bulldog Dracónico ◈13000.

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
| `dmg` | Munición perforante | 0.12 | 0.18 | 0.27 | 0.4 | 10 | ∞ | +40% de daño |
| `aspd` | Gatillo ligero | 0.1 | 0.15 | 0.22 | 0.32 | 10 | ∞ | +32% de velocidad de ataque |
| `move` | Botas de sprint | 0.08 | 0.12 | 0.18 | 0.26 | 7 | 6 | +26% de velocidad de movimiento |
| `range` | Mira de largo alcance | 0.15 | 0.22 | 0.32 | 0.5 | 6 | 6 | +50% de alcance de proyectiles |
| `proj` | Cargador doble | — | 1 | 1 | 2 | 5 | 5 | +2 proyectiles adicionales en todas las armas |
| `crit` | Ojo de halcón | 0.06 | 0.1 | 0.15 | 0.25 | 7 | ∞ | +25% de probabilidad de crítico |
| `area` | Carga expansiva | 0.12 | 0.2 | 0.3 | 0.45 | 6 | ∞ | +45% de radio de explosión y habilidades |
| `healing` | Matriz de curación | 0.15 | 0.25 | 0.4 | 0.6 | 5 | 5 | +60% de eficacia de curación |
| `cdr` | Circuitos de recarga | 0.06 | 0.1 | 0.15 | 0.22 | 7 | 6 | -22% de tiempo de recarga de habilidades |
| `healnow` | Kit de reparación | 0.15 | 0.25 | 0.4 | 0.7 | 5 | ∞ | Recuperas 70% de tu vida máxima |
| `maxhp` | Blindaje reforzado | 10 | 18 | 30 | 50 | 7 | ∞ | +50 de vida máxima |
| `xp` | Datos tácticos | 0.1 | 0.16 | 0.25 | 0.4 | 6 | 6 | +40% de experiencia obtenida |
| `chain` | Arco eléctrico | — | 1 | 1 | 2 | 4 | 5 | Los impactos saltan a 2 enemigos más (daño en cadena) |
| `pierce` | Balas de tungsteno | 1 | 1 | 2 | 3 | 6 | 6 | Las balas atraviesan 3 enemigos más |
| `drone` | Dron auxiliar | — | — | 1 | 2 | 3 | 5 | +2 drones que orbita y dispara |
| `shield` | Escudo regenerativo | 10 | 18 | 30 | 50 | 5 | ∞ | +50 de escudo que se regenera fuera de combate |
| `killexp` | Eliminación explosiva | 0.4 | 0.6 | 1 | 1.6 | 5 | ∞ | Los enemigos explotan al morir (+19 de daño en área) |
| `regen` | Nanobots | 0.4 | 0.8 | 1.4 | 2.2 | 5 | ∞ | +2.2 de vida por segundo |
| `magnet` | Imán de orbes | 0.25 | 0.4 | 0.6 | 1 | 4 | 4 | +100% de radio de recogida |
| `burn` | Munición incendiaria | — | 3 | 6 | 12 | 4 | 4 | Los disparos incendian al enemigo (12 de daño/s) |
| `ult` | Carga rápida de definitiva | 0.15 | 0.25 | 0.4 | 0.6 | 4 | 4 | +60% de carga de la definitiva |
| `vamp` | Succión vital | 0.2 | 0.4 | 0.7 | 1.2 | 4 | 5 | Recuperas 1.2 de vida por eliminación |

## Mejoras permanentes

| id | Nombre | Por nivel | Máx. | Descripción |
|---|---|---|---|---|
| `dmg` | Daño | +3% | 10 | Daño de todas tus armas y habilidades |
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
| `ascent` | Ascent | Ciudad italiana infinita: tejados de terracota, calles de adoquín, plazas con fuente y sitios A/B. |
| `bind` | Bind | Bazar del desierto infinito: muros de adobe, patios, alfombras, sitios A/B y teletransportadores. |
| `haven` | Haven | Monasterio de montaña infinito: templos de tejado rojo, jardines, estanques y sitios A/B/C. |

## Mercado nocturno

- 4 cartas por jugador, nueva rotación cada 24 h (medianoche UTC).
- Las 3 primeras son armas exclusivas distintas; la última es un agente exclusivo con probabilidad 35% (si no, otra arma).
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

Siempre activas además: flechas (mover), Esc (pausa), 1/2/3 (elegir mejora).

## Historial de versiones (Novedades)

| Versión | Fecha | Título | Tipo |
|---|---|---|---|
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
