import { cli } from 'cleye';
import { c as conversionPurposes, a as convertCurrency } from './convert-currency-DuxaNSLK.mjs';
import { j as jsonFlag } from './flags-cRSEqXfq.mjs';
import { r as requireResult, e as exitOnError, f as fail, s as style } from './shared-D2Hs5kU-.mjs';
import { b as formatConversion } from './format-DQugMBKY.mjs';
import './date-Ch1m7K65.mjs';
import './number-DrM6UAah.mjs';
import './fetch-rates-DEapXvMJ.mjs';
import 'linkedom';
import './utils-CAeY9tnY.mjs';
import './rate-units-4VBNvvzQ.mjs';
import './fetch-source-CRkPC07b.mjs';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import 'ansis';
import './format-table-CEOACGRX.mjs';
import 'string-width';

const requireFlag = (value, name) => {
  if (value === void 0) {
    fail(`Missing required flag: --${name}`);
  }
  if (typeof value === "string" && value === "") {
    fail(`Missing required flag: --${name}`);
  }
  return value;
};
const parseConversionRate = (rate) => {
  if (rate === void 0) {
    return void 0;
  }
  const normalized = rate.toLowerCase();
  if (normalized === "tts" || normalized === "ttb" || normalized === "ttm") {
    return normalized;
  }
  return fail(`Invalid rate: ${rate} (expected tts, ttb, or ttm)`);
};
const argv = cli({
  flags: {
    amount: {
      type: Number,
      alias: "a",
      description: "Amount to convert"
    },
    from: {
      type: String,
      alias: "f",
      description: "Source currency code"
    },
    to: {
      type: String,
      alias: "t",
      description: "Target currency code"
    },
    date: {
      type: String,
      alias: "d",
      description: "Conversion date (YYYY-MM-DD)"
    },
    rate: {
      type: String,
      alias: "r",
      description: "Rate type: tts, ttb, or ttm"
    },
    purpose: {
      type: String,
      alias: "p",
      description: `Pick the rate type tax rules specify: ${conversionPurposes.join(", ")}`
    },
    json: jsonFlag
  }
});
const result = requireResult(
  await exitOnError(convertCurrency({
    amount: requireFlag(argv.flags.amount, "amount"),
    from: requireFlag(argv.flags.from, "from"),
    to: requireFlag(argv.flags.to, "to"),
    date: requireFlag(argv.flags.date, "date"),
    rate: parseConversionRate(argv.flags.rate),
    purpose: argv.flags.purpose
  })),
  "No rates found for this date (non-business day or out of range)"
);
if (argv.flags.json) {
  console.log(JSON.stringify(result));
} else {
  console.log(formatConversion(result, style));
}
