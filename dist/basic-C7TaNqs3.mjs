import { cli } from 'cleye';
import { f as fetchBasicRates } from './fetch-basic-C9pCmq3Y.mjs';
import { j as jsonFlag, c as currencyFlag } from './flags-cRSEqXfq.mjs';
import { r as requireResult, e as exitOnError, n as normalizeCurrency, p as pickCurrency, f as fail, s as style } from './shared-D2Hs5kU-.mjs';
import { f as formatBasic } from './format-Cj1NsPpe.mjs';
import { p as parseMonth } from './month-Df1ueGZS.mjs';
import 'linkedom';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import './number-DrM6UAah.mjs';
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
const result = requireResult(await exitOnError(fetchBasicRates(year, month)), "No BOJ basic rates found for this month");
const currency = argv.flags.currency && normalizeCurrency(argv.flags.currency);
const cross = currency ? pickCurrency(result.cross, currency) : result.cross;
const reference = currency ? result.reference.filter((row) => row.code === currency) : result.reference;
const arbitrated = currency ? pickCurrency(result.arbitrated, currency) : result.arbitrated;
if (currency && currency !== "USD" && !Object.keys(cross).length && reference.length === 0) {
  fail(`Currency ${currency} not found in results`);
}
const filtered = {
  ...result,
  cross,
  reference,
  arbitrated
};
console.log(argv.flags.json ? JSON.stringify(filtered) : formatBasic(filtered, style, !currency || currency === "USD"));
