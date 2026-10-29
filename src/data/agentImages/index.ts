// Generado por scripts/cut-agent.ts: agentes dibujados a partir de su hoja de sprites
// (la imagen está en public/agents/<id>.png: una fila por vista —frente, espalda, lado— y una columna por paso).
import jett from './jett.json';
import killjoy from './killjoy.json';
import neon from './neon.json';
import omen from './omen.json';
import phoenix from './phoenix.json';
import raze from './raze.json';
import reyna from './reyna.json';
import sage from './sage.json';

export interface AgentImage { w: number; h: number; px: number; front: number; back: number; side: number }
export const AGENT_IMAGES: Record<string, AgentImage> = { jett, killjoy, neon, omen, phoenix, raze, reyna, sage };
