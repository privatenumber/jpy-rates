import { cli } from 'cleye';
import { f as fetchDailyMarketRates, a as fetchMonthlyMarketRates } from './fetch-market-vaI9s0lZ.mjs';
import { p as parseDate } from './date-Ch1m7K65.mjs';
import { j as jsonFlag } from './flags-cRSEqXfq.mjs';
import { f as fail, r as requireResult, e as exitOnError, s as style } from './shared-D2Hs5kU-.mjs';
import { b as formatDailyMarket, c as formatMonthlyMarket } from './format-Cj1NsPpe.mjs';
import './stat-api-CH6LPDbX.mjs';
import './sources-DwUUADTL.mjs';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import 'ansis';
import './format-table-CEOACGRX.mjs';
import 'string-width';

const argv = cli({
  parameters: ["<date or month>"],
  flags: {
    daily: {
      type: Boolean,
      description: "With a month, list every trading day instead of the monthly summary"
    },
    json: jsonFlag
  },
  help: {
    description: "Tokyo interbank USD/JPY spot rates: one day (YYYY-MM-DD) or a monthly summary (YYYY-MM)"
  }
});
const input = argv._.dateOrMonth;
const match = input.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
if (!match) {
  fail("Expected a date in YYYY-MM-DD or a month in YYYY-MM format");
}
const year = Number(match[1]);
const month = Number(match[2]);
const isDate = match[3] !== void 0;
if (isDate && argv.flags.daily) {
  fail("--daily needs a month (YYYY-MM), not a date");
}
if (isDate) {
  try {
    parseDate(input);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}
if (isDate || argv.flags.daily) {
  const result = requireResult(
    await exitOnError(fetchDailyMarketRates(year, month)),
    `No Tokyo market rates published for ${year}-${match[2]}`
  );
  const days = isDate ? result.days.filter((day) => day.date === input) : result.days;
  if (days.length === 0) {
    fail(`No Tokyo market rates for ${input} (not a trading day, or not published yet)`);
  }
  const filtered = {
    ...result,
    days
  };
  console.log(argv.flags.json ? JSON.stringify(filtered) : formatDailyMarket(filtered, style, `Tokyo market USD/JPY ${input}`));
} else {
  const result = requireResult(
    await exitOnError(fetchMonthlyMarketRates(year, month)),
    `No Tokyo market summary published for ${input} (a month is summarized after it ends)`
  );
  console.log(argv.flags.json ? JSON.stringify(result) : formatMonthlyMarket(result, style));
}
