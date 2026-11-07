import { cli } from 'cleye';
import { f as fetchReportingRates } from './fetch-reporting-B0aIFcPa.mjs';
import { j as jsonFlag, c as currencyFlag } from './flags-cRSEqXfq.mjs';
import { r as requireResult, e as exitOnError, n as normalizeCurrency, a as filterCurrency, s as style } from './shared-D2Hs5kU-.mjs';
import { a as formatReporting } from './format-Cj1NsPpe.mjs';
import { p as parseMonth } from './month-Df1ueGZS.mjs';
import 'linkedom';
import 'xlsx';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import './common-BWRtWuj4.mjs';
import './sources-DwUUADTL.mjs';
import './date-Ch1m7K65.mjs';
import 'ansis';
import './format-table-CEOACGRX.mjs';
import 'string-width';

const argv = cli({
  parameters: ["<month>"],
  flags: {
    currency: currencyFlag,
    json: jsonFlag
  }
});
const [year, month] = parseMonth(argv._.month);
const result = requireResult(await exitOnError(fetchReportingRates(year, month)), "No BOJ reporting rates found for this month");
const currency = argv.flags.currency && normalizeCurrency(argv.flags.currency);
const filtered = {
  ...result,
  rates: currency ? filterCurrency(result.rates, currency) : result.rates
};
console.log(argv.flags.json ? JSON.stringify(filtered) : formatReporting(filtered, style));
