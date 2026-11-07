import { f as fetchSource } from './fetch-source-BHAj9IoI.mjs';
import { f as fetchShiftJisHtml } from './fetch-source-CRkPC07b.mjs';

const baseUrl = "https://www.murc-kawasesouba.jp/fx/worlddata/";
const regionFiles = ["asia", "africa", "europe", "mideast", "america"];
const parseCsvRecords = (text) => {
  const records = [];
  let fields = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inQuotes) {
      if (character !== '"') {
        current += character;
      } else if (text[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = false;
      }
    } else {
      switch (character) {
        case '"': {
          inQuotes = true;
          break;
        }
        case ",": {
          fields.push(current.trim());
          current = "";
          break;
        }
        case "\n": {
          fields.push(current.trim());
          records.push(fields);
          fields = [];
          current = "";
          break;
        }
        case "\r": {
          break;
        }
        default: {
          current += character;
        }
      }
    }
  }
  fields.push(current.trim());
  records.push(fields);
  return records.filter((record) => record.some((field) => field.length > 0));
};
const headerColumns = ["japanese", "currencyunit", "codeaddress", "quotations", "rateofexchange", "remarks"];
const parseCsv = (text, filename) => {
  const records = parseCsvRecords(text);
  const header = records[0]?.map((field) => field.trim().toLowerCase()) ?? [];
  if (headerColumns.some((column, index) => header[index + 1] !== column) || records.length < 2) {
    throw new Error(`Unexpected world rates CSV (${filename}.csv): header ${JSON.stringify(records[0]?.slice(0, 7) ?? [])}, ${records.length} records`);
  }
  const cleanHtml = (html) => html.replaceAll("<br>", " ").replaceAll(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replaceAll("&yen;", "\xA5").replaceAll("&reg;", "").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&amp;", "&").trim();
  return records.slice(1).map((fields) => ({
    country: cleanHtml(fields[0] ?? ""),
    countryJa: cleanHtml(fields[1] ?? ""),
    currency: cleanHtml(fields[2] ?? ""),
    code: cleanHtml(fields[3] ?? ""),
    quotation: cleanHtml(fields[4] ?? ""),
    marketLevel: cleanHtml(fields[5] ?? ""),
    remarks: cleanHtml(fields[6] ?? "")
  }));
};
const fetchCsv = async (filename, options) => {
  const response = await fetchSource(`${baseUrl}${filename}.csv`, options);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Failed to fetch ${filename}.csv (HTTP ${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const text = new TextDecoder("shift_jis").decode(buffer);
  return parseCsv(text, filename);
};
const parseDateFromText = (text) => {
  const match = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日[）)\s]*現在/);
  if (!match) {
    const allDates = [...text.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日/g)];
    const last = allDates.at(-1);
    if (!last) {
      throw new Error("Could not extract date from world page");
    }
    const [, year2, month2, day2] = last;
    return `${year2}-${month2.padStart(2, "0")}-${day2.padStart(2, "0")}`;
  }
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};
const fetchWorld = async (options = {}) => {
  const html = await fetchShiftJisHtml("https://www.murc-kawasesouba.jp/fx/world.html", options);
  if (!html) {
    throw new Error("Failed to fetch world page");
  }
  const date = parseDateFromText(html);
  const [asia, africa, europe, mideast, americas] = await Promise.all(
    regionFiles.map((region) => fetchCsv(region, options))
  );
  return {
    source: "https://www.murc-kawasesouba.jp/fx/world.html",
    date,
    asia,
    africa,
    europe,
    mideast,
    americas
  };
};

export { fetchWorld as f };
