import { cli } from 'cleye';
import { f as fetchWorld } from './fetch-world-m8MEjupp.mjs';
import { j as jsonFlag } from './flags-cRSEqXfq.mjs';
import { e as exitOnError, s as style } from './shared-D2Hs5kU-.mjs';
import { e as formatWorld } from './format-DQugMBKY.mjs';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import './fetch-source-CRkPC07b.mjs';
import 'ansis';
import './format-table-CEOACGRX.mjs';
import 'string-width';

const argv = cli({
  flags: {
    json: jsonFlag
  }
});
const result = await exitOnError(fetchWorld());
if (argv.flags.json) {
  console.log(JSON.stringify(result));
} else {
  console.log(formatWorld(result, style));
}
