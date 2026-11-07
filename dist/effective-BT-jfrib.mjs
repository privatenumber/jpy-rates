import { cli } from 'cleye';
import { f as fetchEffectiveRates } from './fetch-effective-LJYCOu0t.mjs';
import { j as jsonFlag } from './flags-cRSEqXfq.mjs';
import { f as fail, r as requireResult, e as exitOnError, s as style } from './shared-D2Hs5kU-.mjs';
import { d as formatEffective } from './format-Cj1NsPpe.mjs';
import './stat-api-CH6LPDbX.mjs';
import './sources-DwUUADTL.mjs';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import 'ansis';
import './format-table-CEOACGRX.mjs';
import 'string-width';

const argv = cli({
  parameters: ["<month>"],
  flags: {
    json: jsonFlag
  },
  help: {
    description: "The yen's nominal and real effective exchange rate indices for a month (YYYY-MM)"
  }
});
const match = argv._.month.match(/^(\d{4})-(\d{2})$/);
if (!match) {
  fail("Expected month in YYYY-MM format");
}
const result = requireResult(
  await exitOnError(fetchEffectiveRates(Number(match[1]), Number(match[2]))),
  `No effective exchange rate indices published for ${argv._.month}`
);
console.log(argv.flags.json ? JSON.stringify(result) : formatEffective(result, style));
