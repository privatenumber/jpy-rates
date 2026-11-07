import { parseHTML } from 'linkedom';
import { r as rateSources } from './sources-DwUUADTL.mjs';
import { f as formatDate, p as parseDate } from './date-Ch1m7K65.mjs';
import { f as fetchSource } from './fetch-source-BHAj9IoI.mjs';
import { fileURLToPath } from 'node:url';

const eraDate = (era, year, western, month, day) => {
  const number = year === "\u5143" ? 1 : Number(year);
  if (number < 1) {
    throw new Error(`Invalid Japanese era year: ${era}${year}\u5E74`);
  }
  const westernYear = (era === "\u4EE4\u548C" ? 2018 : 1988) + number;
  if (western && Number(western) !== westernYear) {
    throw new Error(`Japanese era year does not match Western year: ${era}${year}\u5E74(${western}\u5E74)`);
  }
  const value = `${westernYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const date = formatDate(parseDate(value));
  if (!western && (era === "\u4EE4\u548C" && date < "2019-05-01" || era === "\u5E73\u6210" && (date < "1989-01-08" || date > "2019-04-30"))) {
    throw new Error(`Invalid Japanese era date: ${era}${year}\u5E74${month}\u6708${day}\u65E5`);
  }
  return date;
};
const parseCustomsText = (pages, expected) => {
  const periodText = pages.flat().map((item) => item.str).join("").normalize("NFKC").replaceAll(/\s/g, "");
  const period = periodText.match(/適用期間\s*[:：]\s*(平成|令和)(元|\d+)年(?:\((\d{4})年\))?(\d+)月(\d+)日から(平成|令和)(元|\d+)年(?:\((\d{4})年\))?(\d+)月(\d+)日まで/);
  if (!period) {
    throw new Error("Customs PDF has no recognizable application period");
  }
  const start = eraDate(period[1], period[2], period[3], period[4], period[5]);
  const end = eraDate(period[6], period[7], period[8], period[9], period[10]);
  if (start !== expected.start || end !== expected.end) {
    throw new Error(`Customs PDF period ${start} to ${end} does not match index ${expected.start} to ${expected.end}`);
  }
  const rates = {};
  const equivalents = [];
  for (const items of pages) {
    const codes = items.filter((item) => /^[A-Z]{3}$/.test(item.str) && item.str !== "ISO");
    const markers = items.filter((item) => item.x < 100 && /^\d{3}他?$/.test(item.str.trim()) || item.str.trim() === "\u6B27\u5DDE\u7D71\u4E00\u901A\u8CA8");
    if (markers.length !== codes.length || markers.some((marker) => codes.filter((code) => Math.abs(code.y - marker.y) < 3).length !== 1)) {
      throw new Error(`Customs PDF row markers (${markers.length}) do not match currency codes (${codes.length})`);
    }
    for (const codeItem of codes) {
      const row = items.filter((item) => Math.abs(item.y - codeItem.y) < 3 && item.str.trim()).sort((a, b) => a.x - b.x);
      const country = row.filter((item) => item.x > codeItem.x - 275 && item.x < codeItem.x - 100).map((item) => item.str.trim()).join("");
      const currencyJa = row.filter((item) => item.x >= codeItem.x - 100 && item.x < codeItem.x - 10).map((item) => item.str.trim()).join("");
      const values = row.filter((item) => item.x > codeItem.x + 20).map((item) => item.str.trim());
      if (!country || !currencyJa || values.length !== 1 || Object.hasOwn(rates, codeItem.str)) {
        throw new Error(`Unexpected Customs PDF row for ${codeItem.str}: ${JSON.stringify(row)}`);
      }
      const value = values[0];
      const valueItem = row.find((item) => item.str.trim() === value);
      const equivalent = value.match(/^(.+)と等価$/);
      if (!equivalent && !/^\d+(?:\.\d+)?$/.test(value)) {
        throw new Error(`Unexpected Customs rate for ${codeItem.str}: ${value}`);
      }
      rates[codeItem.str] = {
        code: codeItem.str,
        countries: [country],
        currencyJa,
        unit: valueItem.x > codeItem.x + 120 ? 100 : 1,
        rate: equivalent ? 0 : Number(value),
        equivalentTo: null
      };
      if (equivalent) {
        equivalents.push({
          code: codeItem.str,
          name: equivalent[1]
        });
      }
    }
  }
  if (Object.keys(rates).length === 0) {
    throw new Error("Customs PDF contains no rates");
  }
  for (const equivalent of equivalents) {
    const matches = Object.values(rates).filter((rate) => `${rate.countries[0]}\u30FB${rate.currencyJa}` === equivalent.name);
    if (matches.length !== 1 || equivalents.some((entry) => entry.code === matches[0].code)) {
      throw new Error(`Cannot resolve equivalent currency: ${equivalent.name}`);
    }
    const target = matches[0];
    Object.assign(rates[equivalent.code], {
      unit: target.unit,
      rate: target.rate,
      equivalentTo: target.code
    });
  }
  return rates;
};
const parseCustomsPdf = async (data, period) => {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const packageUrl = import.meta.resolve("pdfjs-dist/package.json");
  const task = getDocument({
    data,
    cMapUrl: fileURLToPath(new URL("cmaps/", packageUrl)),
    cMapPacked: true,
    standardFontDataUrl: fileURLToPath(new URL("standard_fonts/", packageUrl))
  });
  try {
    const document = await task.promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.flatMap((item) => "str" in item ? [{
        str: item.str,
        x: item.transform[4],
        y: item.transform[5]
      }] : []));
    }
    return parseCustomsText(pages, period);
  } finally {
    await task.destroy();
  }
};

const indexUrl = "https://www.customs.go.jp/tetsuzuki/kawase/index.htm";
const fetchCustomsRates = async (date, options) => {
  const requested = formatDate(parseDate(date));
  const response = await fetchSource(indexUrl, options);
  if (!response.ok) {
    throw new Error(`Customs index returned HTTP ${response.status}`);
  }
  const html = new TextDecoder("shift_jis").decode(await response.arrayBuffer());
  const { document } = parseHTML(html);
  const weeks = Array.from(document.querySelectorAll("a[href]")).flatMap((anchor) => {
    const href = anchor.getAttribute("href");
    const match = href.match(/kouji-rate(\d{8})-(\d{4}|\d{6}|\d{8})\.pdf$/i);
    if (!match) {
      if (/kouji-rate.*\.pdf$/i.test(href)) {
        throw new Error(`Unrecognized Customs PDF link: ${href}`);
      }
      return [];
    }
    const start = `${match[1].slice(0, 4)}-${match[1].slice(4, 6)}-${match[1].slice(6, 8)}`;
    const prefixLength = 8 - match[2].length;
    const endDigits = `${match[1].slice(0, prefixLength)}${match[2]}`;
    const end = `${endDigits.slice(0, 4)}-${endDigits.slice(4, 6)}-${endDigits.slice(6, 8)}`;
    parseDate(start);
    parseDate(end);
    if (end < start) {
      throw new Error(`Invalid Customs PDF period: ${href}`);
    }
    return [{
      start,
      end,
      url: new URL(href, indexUrl).href
    }];
  });
  if (weeks.length === 0) {
    throw new Error("Unexpected Customs index structure: no weekly PDF links");
  }
  const earliest = weeks.map((week2) => week2.start).sort()[0];
  if (requested < earliest) {
    throw new RangeError(`Date ${requested} is before the earliest available date ${earliest}`);
  }
  const matches = weeks.filter((week2) => week2.start <= requested && requested <= week2.end);
  if (matches.length > 1) {
    throw new Error(`Multiple Customs periods cover ${requested}`);
  }
  const week = matches[0];
  if (!week) {
    return null;
  }
  const pdf = await fetchSource(week.url, options);
  if (!pdf.ok) {
    throw new Error(`Customs PDF returned HTTP ${pdf.status}: ${week.url}`);
  }
  const rates = await parseCustomsPdf(new Uint8Array(await pdf.arrayBuffer()), week);
  return {
    source: week.url,
    attribution: rateSources.find((source) => source.id === "customs").attribution,
    period: {
      start: week.start,
      end: week.end
    },
    rates
  };
};

export { fetchCustomsRates as f };
