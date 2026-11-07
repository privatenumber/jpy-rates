import { cli } from 'cleye';
import { f as fetchMonthly } from './fetch-monthly-gHYi0cvo.mjs';
import { j as jsonFlag, c as currencyFlag } from './flags-cRSEqXfq.mjs';
import { r as requireResult, e as exitOnError, n as normalizeCurrency, p as pickCurrency, f as fail, s as style } from './shared-D2Hs5kU-.mjs';
import { c as formatMonthly } from './format-DQugMBKY.mjs';
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
  parameters: ["<year>", "<month>"],
  flags: {
    currency: currencyFlag,
    json: jsonFlag
  }
});
const result = requireResult(
  await exitOnError(fetchMonthly(Number(argv._.year), Number(argv._.month))),
  "No monthly rates found for this period"
);
const currency = argv.flags.currency && normalizeCurrency(argv.flags.currency);
const filtered = currency ? {
  ...result,
  rates: pickCurrency(result.rates, currency),
  localMarketRates: result.localMarketRates && pickCurrency(result.localMarketRates, currency)
} : result;
if (currency && Object.keys(filtered.rates).length === 0) {
  if (filtered.localMarketRates === null) {
    fail(`Currency ${currency} is not in the main rate table, and this page's local market section is unavailable (MURC's page shows a server error there; for the latest month it usually appears later)`);
  }
  if (Object.keys(filtered.localMarketRates).length === 0) {
    fail(`Currency ${currency} not found in results`);
  }
}
if (argv.flags.json) {
  console.log(JSON.stringify(filtered));
} else {
  console.log(formatMonthly(filtered, style));
}
