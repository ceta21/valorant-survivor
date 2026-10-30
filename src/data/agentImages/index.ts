// Generado por scripts/cut-agent.ts: agentes dibujados a partir de su hoja de sprites
// (la imagen está en public/agents/<id>.png: una fila por vista —frente, espalda, lado— y una columna por paso).
import aqua from './aqua.json';
import brutus from './brutus.json';
import draco from './draco.json';
import ember from './ember.json';
import frost from './frost.json';
import grim from './grim.json';
import kael from './kael.json';
import lyra from './lyra.json';
import morgan from './morgan.json';
import nox from './nox.json';
import raven from './raven.json';
import seraph from './seraph.json';
import sora from './sora.json';
import sylvan from './sylvan.json';
import talos from './talos.json';
import tink from './tink.json';
import vex from './vex.json';
import volt from './volt.json';
import zahir from './zahir.json';
import zephyr from './zephyr.json';

export interface AgentImage { w: number; h: number; px: number; front: number; back: number; side: number }
export const AGENT_IMAGES: Record<string, AgentImage> = { aqua, brutus, draco, ember, frost, grim, kael, lyra, morgan, nox, raven, seraph, sora, sylvan, talos, tink, vex, volt, zahir, zephyr };
