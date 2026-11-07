import { cli } from 'cleye';
import { f as fetchCustomsRates } from './fetch-rates-DP57GL05.mjs';
import { j as jsonFlag, c as currencyFlag } from './flags-cRSEqXfq.mjs';
import { f as formatTable } from './format-table-CEOACGRX.mjs';
import { r as requireResult, e as exitOnError, a as filterCurrency, n as normalizeCurrency, s as style } from './shared-D2Hs5kU-.mjs';
import 'linkedom';
import './sources-DwUUADTL.mjs';
import './date-Ch1m7K65.mjs';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import 'node:url';
import 'string-width';
import 'ansis';

const argv = cli({
  parameters: ["<date>"],
  flags: {
    currency: currencyFlag,
    json: jsonFlag
  }
});
const result = requireResult(await exitOnError(fetchCustomsRates(argv._.date)), "No Customs rates published for this date");
const filtered = argv.flags.currency ? {
  ...result,
  rates: filterCurrency(result.rates, normalizeCurrency(argv.flags.currency))
} : result;
if (argv.flags.json) {
  console.log(JSON.stringify(filtered));
} else {
  const entries = Object.values(filtered.rates);
  const rows = entries.map((rate) => [
    style.bold(rate.unit === 100 ? `${rate.code}*` : rate.code),
    rate.countries.join(", "),
    rate.currencyJa,
    rate.rate.toFixed(2),
    rate.equivalentTo ? `Derived from ${rate.equivalentTo}` : ""
  ]);
  const sections = [
    style.bold(`${result.period.start} - ${result.period.end}`),
    "",
    formatTable([{ header: "Code" }, { header: "Country" }, { header: "Currency" }, {
      header: "JPY",
      align: "right"
    }, { header: "Note" }], rows, style)
  ];
  if (entries.some((rate) => rate.unit === 100)) {
    sections.push("", style.dim("* per 100 units"));
  }
  sections.push("", `Source: ${result.source}`, result.attribution);
  console.log(sections.join("\n"));
}
