import { cli } from 'cleye';
import { f as fetchDaily } from './fetch-daily-BfvsvHL3.mjs';
import { j as jsonFlag, c as currencyFlag } from './flags-cRSEqXfq.mjs';
import { r as requireResult, e as exitOnError, n as normalizeCurrency, p as pickCurrency, a as filterCurrency, s as style } from './shared-D2Hs5kU-.mjs';
import { a as formatDaily } from './format-DQugMBKY.mjs';
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
  parameters: ["[date]"],
  flags: {
    currency: currencyFlag,
    json: jsonFlag
  }
});
const result = requireResult(
  await exitOnError(fetchDaily(argv._.date)),
  "No daily rates found for this date (non-business day or out of range)"
);
const currency = argv.flags.currency && normalizeCurrency(argv.flags.currency);
const filtered = currency ? {
  ...result,
  rates: filterCurrency(result.rates, currency),
  cashRates: pickCurrency(result.cashRates, currency)
} : result;
if (argv.flags.json) {
  console.log(JSON.stringify(filtered));
} else {
  console.log(formatDaily(filtered, style));
}
