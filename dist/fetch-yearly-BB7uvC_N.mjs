import { parseHTML } from 'linkedom';
import { g as getTodayInJapan } from './date-Ch1m7K65.mjs';
import { c as cleanCellText, b as parseUnit, p as parseRate, a as computeTtm } from './utils-CAeY9tnY.mjs';
import { f as fetchShiftJisHtml, u as unexpectedPageError } from './fetch-source-CRkPC07b.mjs';

const columnsPerRow = 9;
const parseTable = (table) => {
  const cells = Array.from(table.querySelectorAll("td"));
  const rates = {};
  for (let i = 0; i + columnsPerRow <= cells.length; i += columnsPerRow) {
    const name = cleanCellText(cells[i].textContent ?? "");
    const nameJa = cleanCellText(cells[i + 1].textContent ?? "");
    const code = (cells[i + 2].textContent ?? "").trim();
    const unit = parseUnit(cells[i + 3].textContent ?? "");
    const yearEndTts = parseRate(cells[i + 4].textContent ?? "");
    const yearEndTtb = parseRate(cells[i + 5].textContent ?? "");
    const yearlyAverageTts = parseRate(cells[i + 6].textContent ?? "");
    const yearlyAverageTtb = parseRate(cells[i + 7].textContent ?? "");
    if (code) {
      rates[code] = {
        name,
        nameJa,
        unit,
        yearEnd: {
          tts: yearEndTts,
          ttb: yearEndTtb,
          ttm: computeTtm(yearEndTts, yearEndTtb)
        },
        yearlyAverage: {
          tts: yearlyAverageTts,
          ttb: yearlyAverageTtb,
          ttm: computeTtm(yearlyAverageTts, yearlyAverageTtb)
        }
      };
    }
  }
  return rates;
};
const earliestYear = 2003;
const fetchYearly = async (year, options = {}) => {
  const currentYear = getTodayInJapan().getUTCFullYear();
  if (!Number.isInteger(year) || year < earliestYear || year > currentYear) {
    throw new RangeError(`Year ${year} is outside the available range (${earliestYear} to ${currentYear})`);
  }
  const yearEndUrl = `https://www.murc-kawasesouba.jp/fx/yearend/index.php?id=${year}`;
  let html = await fetchShiftJisHtml(yearEndUrl, options);
  let source = yearEndUrl;
  if (!html) {
    const yearAverageUrl = "https://www.murc-kawasesouba.jp/fx/year_average.php";
    html = await fetchShiftJisHtml(yearAverageUrl, options);
    if (html) {
      source = yearAverageUrl;
      const { document: document2 } = parseHTML(html);
      const headingText = document2.querySelector("h2")?.textContent ?? "";
      if (!headingText.includes(`${year}\u5E74`)) {
        return null;
      }
    }
  }
  if (!html) {
    return null;
  }
  const { document } = parseHTML(html);
  const table = document.querySelector("table.data-table7");
  if (!table) {
    throw unexpectedPageError(source, "missing rate table", html);
  }
  const rates = parseTable(table);
  if (Object.keys(rates).length === 0) {
    throw unexpectedPageError(source, "empty rate table", html);
  }
  return {
    source,
    year,
    rates
  };
};

export { fetchYearly as f };
