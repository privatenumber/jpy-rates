import { parseHTML } from 'linkedom';
import { p as parseDate, a as assertDateInRange, f as formatDate } from './date-Ch1m7K65.mjs';
import { c as cleanCellText, p as parseRate, a as computeTtm, f as formatDateId } from './utils-CAeY9tnY.mjs';
import { f as findRatesOnOrBefore, g as getDailyRateUnit } from './rate-units-4VBNvvzQ.mjs';
import { f as fetchShiftJisHtml, u as unexpectedPageError } from './fetch-source-CRkPC07b.mjs';

const mainColumnsPerRow = 6;
const cashColumnsPerRow = 4;
const parseMainTable = (table, year) => {
  const cells = Array.from(table.querySelectorAll("td"));
  const rates = {};
  for (let i = 0; i + mainColumnsPerRow <= cells.length; i += mainColumnsPerRow) {
    const name = cleanCellText(cells[i].textContent ?? "");
    const nameJa = cleanCellText(cells[i + 1].textContent ?? "");
    const code = (cells[i + 2].textContent ?? "").trim();
    const tts = parseRate(cells[i + 3].textContent ?? "");
    const ttb = parseRate(cells[i + 4].textContent ?? "");
    const ttm = computeTtm(tts, ttb);
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
  return rates;
};
const parseCashTable = (table) => {
  const cells = Array.from(table.querySelectorAll("td"));
  const cashRates = {};
  for (let i = 0; i + cashColumnsPerRow <= cells.length; i += cashColumnsPerRow) {
    const code = (cells[i + 1].textContent ?? "").trim();
    const selling = parseRate(cells[i + 2].textContent ?? "");
    const buying = parseRate(cells[i + 3].textContent ?? "");
    if (code && selling !== null && buying !== null) {
      cashRates[code] = {
        selling,
        buying
      };
    }
  }
  return cashRates;
};
const parseDateFromHeading = (document) => {
  const text = document.documentElement?.textContent ?? "";
  const match = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};
const earliestDate = "2005-09-01";
const parseDailyPage = (url, html, tableSelectors) => {
  const { document } = parseHTML(html);
  const tables = tableSelectors.map((selector) => document.querySelectorAll(selector)).find((found) => found.length > 0) ?? [];
  const mainTable = tables[0];
  if (!mainTable) {
    throw unexpectedPageError(url, "missing rate table", html);
  }
  const date = parseDateFromHeading(document);
  if (!date) {
    throw unexpectedPageError(url, "missing date heading", html);
  }
  const rates = parseMainTable(mainTable, Number(date.slice(0, 4)));
  if (Object.keys(rates).length === 0) {
    throw unexpectedPageError(url, "empty rate table", html);
  }
  return {
    source: url,
    date,
    rates,
    cashRates: tables.length >= 2 ? parseCashTable(tables[1]) : {}
  };
};
const fetchDailyForDate = async (date, options) => {
  const url = `https://www.murc-kawasesouba.jp/fx/past/index.php?id=${formatDateId(date)}`;
  const html = await fetchShiftJisHtml(url, options);
  if (!html) {
    return null;
  }
  const result = parseDailyPage(url, html, ["table.data-table7", "table.data-table5"]);
  const expectedDate = formatDate(date);
  if (result.date !== expectedDate) {
    throw new Error(`Source page is dated ${result.date}, expected ${expectedDate}: ${url}`);
  }
  return result;
};
const fetchDaily = async (date, options = {}) => {
  if (!date) {
    const url = "https://www.murc-kawasesouba.jp/fx/index.php";
    const html = await fetchShiftJisHtml(url, options);
    if (!html) {
      return null;
    }
    return parseDailyPage(url, html, ["table.data-table5"]);
  }
  const parsed = parseDate(date);
  assertDateInRange(parsed, earliestDate);
  return findRatesOnOrBefore(parsed, (target) => fetchDailyForDate(target, options));
};

export { fetchDaily as f };
