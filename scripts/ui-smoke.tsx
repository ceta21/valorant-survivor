// Prueba de humo: renderiza cada pantalla de menú a HTML en Node para detectar errores de ejecución.
import { renderToString } from 'react-dom/server';
import { MainMenu } from '../src/components/MainMenu';
import { AgentSelection } from '../src/components/AgentSelection';
import { MetaScreen } from '../src/components/MetaScreen';
import { StatsScreen } from '../src/components/StatsScreen';
import { SettingsScreen } from '../src/components/SettingsScreen';
import { UpgradeSelection } from '../src/components/UpgradeSelection';
import { RankingScreen } from '../src/components/RankingScreen';
import { AuthScreen } from '../src/components/AuthScreen';
import { MarketScreen } from '../src/components/MarketScreen';
import { NewsScreen } from '../src/components/NewsScreen';
import { DEFAULT_KEYS } from '../src/game/controls';
import { defaultSave } from '../src/utils/storage';

const s = defaultSave(); s.credits = 600;
const noop = () => {};
const out: [string, string][] = [
  ['menu', renderToString(<MainMenu save={s} go={noop} account={{ uid: 'x', username: 'Prueba', playerId: 10000 }} accountsEnabled onLogin={noop} onLogout={noop} keys={DEFAULT_KEYS} />)],
  ['market', renderToString(<MarketScreen save={{ ...s, market: { period: Math.floor(Date.now() / 86400000), revealed: [0, 1, 2, 3] } }} seed="test" reveal={noop} buy={noop} back={noop} goAgents={noop} />)],
  ['auth', renderToString(<AuthScreen guestHasProgress onSignIn={async () => {}} onSignUp={async () => {}} onGuest={noop} />)],
  ['agents', renderToString(<AgentSelection save={{ ...s, exclusives: ['eclipse', 'ares_inferno'] }} back={noop} start={noop} unlock={noop} setKit={noop} setLoadout={noop} keys={DEFAULT_KEYS} />)],
  ['meta', renderToString(<MetaScreen save={s} back={noop} buy={noop} />)],
  ['stats', renderToString(<StatsScreen save={s} back={noop} claim={noop} />)],
  ['settings', renderToString(<SettingsScreen settings={s.settings} change={noop} back={noop} reset={noop} prefs={{ lang: 'es', keys: DEFAULT_KEYS }} changePrefs={noop} />)],
  ['ranking', renderToString(<RankingScreen back={noop} />)],
  ['news', renderToString(<NewsScreen back={noop} />)],
  ['levelup', renderToString(<UpgradeSelection level={3} rerolls={2} pick={noop} reroll={noop} choices={[{ id: 'dmg', kind: 'stat', name: 'Munición', desc: '+12%', icon: '✦', rarity: 1, value: 0.12 }]} />)],
];
for (const [n, h] of out) console.log(n, h.length > 500 ? 'OK' : 'VACÍO', h.length);
