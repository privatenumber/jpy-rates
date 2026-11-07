import { parseHTML } from 'linkedom';
import { p as parseDate, a as assertDateInRange, f as formatDate } from './date-Ch1m7K65.mjs';
import { c as cleanCellText, p as parseRate } from './utils-CAeY9tnY.mjs';
import { f as findRatesOnOrBefore, g as getDailyRateUnit, n as normalizeDailyRateCode } from './rate-units-4VBNvvzQ.mjs';
import { f as fetchShiftJisHtml, u as unexpectedPageError } from './fetch-source-CRkPC07b.mjs';

const columnsPerRow = 6;
const earliestDate = "1990-01-01";
const fetchRatesForDate = async (date, options) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const url = `https://www.murc-kawasesouba.jp/fx/past_3month_result.php?y=${year}&m=${month}&d=${day}`;
  const html = await fetchShiftJisHtml(url, options);
  if (!html) {
    return null;
  }
  const { document } = parseHTML(html);
  const table = document.querySelector("table.data-table5");
  if (!table) {
    throw unexpectedPageError(url, "missing rate table", html);
  }
  const cells = Array.from(table.querySelectorAll("td"));
  if (cells.length % columnsPerRow !== 0) {
    throw unexpectedPageError(url, `${cells.length} cells are not rows of ${columnsPerRow}`);
  }
  const rates = {};
  for (let i = 0; i + columnsPerRow <= cells.length; i += columnsPerRow) {
    const name = cleanCellText(cells[i].textContent ?? "");
    const nameJa = cleanCellText(cells[i + 1].textContent ?? "");
    const rawCode = (cells[i + 2].textContent ?? "").trim();
    const code = normalizeDailyRateCode(rawCode, name, nameJa);
    const tts = parseRate(cells[i + 3].textContent ?? "");
    const ttb = parseRate(cells[i + 4].textContent ?? "");
    const ttm = parseRate(cells[i + 5].textContent ?? "");
    const hasAllRates = tts !== null && ttb !== null && ttm !== null;
    const midpointGap = hasAllRates ? Math.abs(ttm - (tts + ttb) / 2) : 0;
    if (midpointGap > 51e-4) {
      throw unexpectedPageError(url, `${rawCode} TTM ${ttm} is not the midpoint of TTS ${tts} and TTB ${ttb}`);
    }
    if (code) {
      rates[code] = {
        name,
        nameJa,
        unit: getDailyRateUnit(code, year),
        tts,
        ttb,
        ttm
      };
    }
  }
  if (Object.keys(rates).length === 0) {
    throw unexpectedPageError(url, "empty rate table", html);
  }
  return {
    source: url,
    date: formatDate(date),
    rates
  };
};
const fetchRates = async (date, options = {}) => {
  const parsed = parseDate(date);
  assertDateInRange(parsed, earliestDate);
  return findRatesOnOrBefore(parsed, (target) => fetchRatesForDate(target, options));
};

export { fetchRates as f };
