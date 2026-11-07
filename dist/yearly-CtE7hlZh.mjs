import { cli } from 'cleye';
import { f as fetchYearly } from './fetch-yearly-BB7uvC_N.mjs';
import { j as jsonFlag, c as currencyFlag } from './flags-cRSEqXfq.mjs';
import { r as requireResult, e as exitOnError, a as filterCurrency, n as normalizeCurrency, s as style } from './shared-D2Hs5kU-.mjs';
import { d as formatYearly } from './format-DQugMBKY.mjs';
import 'linkedom';
import './date-Ch1m7K65.mjs';
import './utils-CAeY9tnY.mjs';
import './fetch-source-CRkPC07b.mjs';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import 'ansis';
import './format-table-CEOACGRX.mjs';
import 'string-width';

const argv = cli({
  parameters: ["<year>"],
  flags: {
    currency: currencyFlag,
    json: jsonFlag
  }
});
const result = requireResult(
  await exitOnError(fetchYearly(Number(argv._.year))),
  "No yearly rates found for this year"
);
const filtered = argv.flags.currency ? {
  ...result,
  rates: filterCurrency(result.rates, normalizeCurrency(argv.flags.currency))
} : result;
if (argv.flags.json) {
  console.log(JSON.stringify(filtered));
} else {
  console.log(formatYearly(filtered, style));
}
