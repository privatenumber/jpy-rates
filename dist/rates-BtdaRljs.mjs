import { cli } from 'cleye';
import { f as fetchRates } from './fetch-rates-DEapXvMJ.mjs';
import { j as jsonFlag, c as currencyFlag } from './flags-cRSEqXfq.mjs';
import { r as requireResult, e as exitOnError, a as filterCurrency, n as normalizeCurrency, s as style } from './shared-D2Hs5kU-.mjs';
import { f as formatRates } from './format-DQugMBKY.mjs';
import 'linkedom';
import './date-Ch1m7K65.mjs';
import './utils-CAeY9tnY.mjs';
import './rate-units-4VBNvvzQ.mjs';
import './fetch-source-CRkPC07b.mjs';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import 'ansis';
import './format-table-CEOACGRX.mjs';
import 'string-width';

const argv = cli({
  parameters: ["<date>"],
  flags: {
    currency: currencyFlag,
    json: jsonFlag
  }
});
const result = requireResult(
  await exitOnError(fetchRates(argv._.date)),
  "No rates found for this date (non-business day or out of range)"
);
const filtered = argv.flags.currency ? {
  ...result,
  rates: filterCurrency(result.rates, normalizeCurrency(argv.flags.currency))
} : result;
if (argv.flags.json) {
  console.log(JSON.stringify(filtered));
} else {
  console.log(formatRates(filtered, style));
}
