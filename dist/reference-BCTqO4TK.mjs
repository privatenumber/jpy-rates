import { cli } from 'cleye';
import { f as fetchReference } from './fetch-reference-DqAoVRf8.mjs';
import { j as jsonFlag } from './flags-cRSEqXfq.mjs';
import { r as requireResult, e as exitOnError, s as style } from './shared-D2Hs5kU-.mjs';
import { g as formatReference } from './format-DQugMBKY.mjs';
import './parse-xls-ZcOCCVSl.mjs';
import 'node:crypto';
import 'xlsx';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import 'ansis';
import './format-table-CEOACGRX.mjs';
import 'string-width';

const argv = cli({
  parameters: ["<year>"],
  flags: {
    json: jsonFlag
  }
});
const result = requireResult(
  await exitOnError(fetchReference(Number(argv._.year))),
  "No reference data found for this year"
);
if (argv.flags.json) {
  console.log(JSON.stringify(result));
} else {
  console.log(formatReference(result, style));
}
