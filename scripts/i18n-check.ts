// Comprueba que todos los textos que pasan por t('…') tienen traducción al inglés.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { EN } from '../src/i18n/en';

const files: string[] = [];
const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(f)) files.push(p); } };
walk('src');
const missing = new Set<string>();
for (const f of files) {
  for (const m of readFileSync(f, 'utf8').matchAll(/\bt\(\s*'([^']*)'/g)) if (!(m[1] in EN) && /[a-záéíóúñ]/i.test(m[1])) missing.add(m[1]);
}
console.log(missing.size ? `Sin traducir (${missing.size}):\n${[...missing].join('\n')}` : 'Todos los textos tienen traducción.');
process.exitCode = missing.size ? 1 : 0;
