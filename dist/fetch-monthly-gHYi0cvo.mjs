import { parseHTML } from 'linkedom';
import { f as formatDate, g as getTodayInJapan } from './date-Ch1m7K65.mjs';
import { c as cleanCellText, b as parseUnit, p as parseRate, a as computeTtm } from './utils-CAeY9tnY.mjs';
import { f as fetchShiftJisHtml, u as unexpectedPageError, a as findServerError } from './fetch-source-CRkPC07b.mjs';

const mainColumnsPerRow = 9;
const namedCurrencyCodes = [
  [/BOLIVAR\s*FUERTE/, "VEF"],
  [/BOLIVAR\s*SOBERANO/, "VES"]
];
const extractCurrencyCode = (text) => {
  const match = text.match(/^([A-Z]{3})/);
  if (match) {
    return match[1];
  }
  return namedCurrencyCodes.find(([pattern]) => pattern.test(text))?.[1] ?? text.trim();
};
const parseMainTable = (table) => {
  const cells = Array.from(table.querySelectorAll("td"));
  const rates = {};
  for (let i = 0; i + mainColumnsPerRow <= cells.length; i += mainColumnsPerRow) {
    const name = cleanCellText(cells[i].textContent ?? "");
    const nameJa = cleanCellText(cells[i + 1].textContent ?? "");
    const code = (cells[i + 2].textContent ?? "").trim();
    const unit = parseUnit(cells[i + 3].textContent ?? "");
    const monthEndTts = parseRate(cells[i + 4].textContent ?? "");
    const monthEndTtb = parseRate(cells[i + 5].textContent ?? "");
    const monthlyAverageTts = parseRate(cells[i + 6].textContent ?? "");
    const monthlyAverageTtb = parseRate(cells[i + 7].textContent ?? "");
    if (code) {
      rates[code] = {
        name,
        nameJa,
        unit,
        monthEnd: {
          tts: monthEndTts,
          ttb: monthEndTtb,
          ttm: computeTtm(monthEndTts, monthEndTtb)
        },
        monthlyAverage: {
          tts: monthlyAverageTts,
          ttb: monthlyAverageTtb,
          ttm: computeTtm(monthlyAverageTts, monthlyAverageTtb)
        }
      };
    }
  }
  return rates;
};
const parseLocalMarketValue = (text, year, month) => {
  const match = text.trim().match(/^[(（](\d{1,2})\/(\d{1,2})[)）](.*)$/s);
  if (!match) {
    return {
      value: parseRate(text),
      quoteDate: null
    };
  }
  const [, quoteMonth, quoteDay, rest] = match;
  const quoteYear = Number(quoteMonth) > month ? year - 1 : year;
  return {
    value: parseRate(rest),
    quoteDate: `${quoteYear}-${quoteMonth.padStart(2, "0")}-${quoteDay.padStart(2, "0")}`
  };
};
const parseLocalMarketTable = (table, year, month) => {
  const localRates = {};
  const rows = Array.from(table.querySelectorAll("tr"));
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("td"));
    const isMergedRate = cells.length === 5 && cells[2]?.getAttribute("colspan") === "2";
    if (!isMergedRate && cells.length !== 6) {
      continue;
    }
    const text = (index) => (cells[index].textContent ?? "").trim();
    const currencyText = text(1);
    const values = (isMergedRate ? [2] : [2, 3]).map(
      (index) => parseLocalMarketValue(text(index), year, month)
    );
    const sourceIndex = isMergedRate ? 3 : 4;
    localRates[extractCurrencyCode(currencyText)] = {
      nameJa: text(0),
      name: currencyText,
      selling: isMergedRate ? null : values[0].value,
      buying: isMergedRate ? null : values[1].value,
      rate: isMergedRate ? values[0].value : null,
      quoteDate: values.find((value) => value.quoteDate)?.quoteDate ?? null,
      sourceJa: text(sourceIndex),
      source: text(sourceIndex + 1)
    };
  }
  return localRates;
};
const earliestMonth = "2005-09";
const fetchMonthly = async (year, month, options = {}) => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid year and month: ${year}-${month}`);
  }
  const monthPadded = month.toString().padStart(2, "0");
  const requestedMonth = `${year}-${monthPadded}`;
  const currentMonth = formatDate(getTodayInJapan()).slice(0, 7);
  if (requestedMonth < earliestMonth || requestedMonth > currentMonth) {
    throw new RangeError(`Month ${requestedMonth} is outside the available range (${earliestMonth} to ${currentMonth})`);
  }
  const id = `${(year % 100).toString().padStart(2, "0")}${monthPadded}`;
  const url = `https://www.murc-kawasesouba.jp/fx/monthend/index.php?id=${id}`;
  const html = await fetchShiftJisHtml(url, options);
  if (!html) {
    return null;
  }
  const { document } = parseHTML(html);
  const tables = Array.from(document.querySelectorAll("table.data-table7, table.data-table7-mb-text"));
  const mainTable = tables[0];
  if (!mainTable) {
    throw unexpectedPageError(url, "missing rate table", html);
  }
  const rates = parseMainTable(mainTable);
  if (Object.keys(rates).length === 0) {
    throw unexpectedPageError(url, "empty rate table", html);
  }
  const parsedLocalRates = {};
  for (const table of tables.slice(1)) {
    Object.assign(parsedLocalRates, parseLocalMarketTable(table, year, month));
  }
  const localMarketRates = Object.keys(parsedLocalRates).length === 0 && findServerError(html) ? null : parsedLocalRates;
  return {
    source: url,
    year,
    month,
    rates,
    localMarketRates
  };
};

export { fetchMonthly as f };
