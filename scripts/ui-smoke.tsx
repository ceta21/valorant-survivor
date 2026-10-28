// Prueba de humo: renderiza cada pantalla de menú a HTML en Node para detectar errores de ejecución.
import { renderToString } from 'react-dom/server';
import { MainMenu } from '../src/components/MainMenu';
import { AgentSelection } from '../src/components/AgentSelection';
import { MetaScreen } from '../src/components/MetaScreen';
import { StatsScreen } from '../src/components/StatsScreen';
import { SettingsScreen } from '../src/components/SettingsScreen';
import { UpgradeSelection } from '../src/components/UpgradeSelection';
import { defaultSave } from '../src/utils/storage';

const s = defaultSave(); s.credits = 600;
const noop = () => {};
const out: [string, string][] = [
  ['menu', renderToString(<MainMenu save={s} go={noop} />)],
  ['agents', renderToString(<AgentSelection save={s} back={noop} start={noop} unlock={noop} />)],
  ['meta', renderToString(<MetaScreen save={s} back={noop} buy={noop} />)],
  ['stats', renderToString(<StatsScreen save={s} back={noop} claim={noop} />)],
  ['settings', renderToString(<SettingsScreen settings={s.settings} change={noop} back={noop} reset={noop} />)],
  ['levelup', renderToString(<UpgradeSelection level={3} rerolls={2} pick={noop} reroll={noop} choices={[{ id: 'dmg', kind: 'stat', name: 'Munición', desc: '+12%', icon: '✦', rarity: 1, value: 0.12 }]} />)],
];
for (const [n, h] of out) console.log(n, h.length > 500 ? 'OK' : 'VACÍO', h.length);
