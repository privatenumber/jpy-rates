import { s as sheetToRows, g as getSheet, f as fetchXls } from './parse-xls-ZcOCCVSl.mjs';

const groupAConfig = [
  {
    code: "CNY",
    sourceColumn: 2,
    // CNY has a single rate (no TTS/TTB split), stored in same column for both
    perUsd: {
      ttsColumn: 2,
      ttbColumn: 2
    },
    perJpy: {
      ttsColumn: 3,
      ttbColumn: 3
    }
  },
  {
    code: "TWD",
    sourceColumn: 4,
    perUsd: {
      ttsColumn: 4,
      ttbColumn: 5
    },
    perJpy: {
      ttsColumn: 6,
      ttbColumn: 7
    }
  },
  {
    code: "MYR",
    sourceColumn: 8,
    perUsd: {
      ttsColumn: 8,
      ttbColumn: 9
    },
    perJpy: {
      ttsColumn: 10,
      ttbColumn: 11
    }
  }
];
const groupBConfig = [
  {
    code: "KRW",
    sourceColumn: 2,
    perUsd: {
      ttsColumn: 2,
      ttbColumn: 3
    }
  },
  {
    code: "IDR",
    sourceColumn: 4,
    perUsd: {
      ttsColumn: 4,
      ttbColumn: 5
    }
  },
  {
    code: "BRL",
    sourceColumn: 6,
    perUsd: {
      ttsColumn: 6,
      ttbColumn: 7
    }
  },
  {
    code: "ARS",
    sourceColumn: 8,
    perUsd: {
      ttsColumn: 8,
      ttbColumn: 9
    }
  },
  {
    code: "CLP",
    sourceColumn: 10,
    // CLP has a single Interbank average — same column for TTS and TTB
    perUsd: {
      ttsColumn: 10,
      ttbColumn: 10
    }
  }
];
const monthSheetNames = ["1\u6708", "2\u6708", "3\u6708", "4\u6708", "5\u6708", "6\u6708", "7\u6708", "8\u6708", "9\u6708", "10\u6708", "11\u6708", "12\u6708"];
const asNumber = (value) => {
  if (typeof value === "number") {
    return value;
  }
  return null;
};
const parseSourceJa = (rows, config) => {
  const headerRow = rows[1];
  if (!headerRow) {
    return "";
  }
  const raw = headerRow[config.sourceColumn];
  if (typeof raw === "string") {
    return raw.replaceAll("\n", " ").trim();
  }
  return "";
};
const parsePerJpyUnit = (rows, config) => {
  if (!config.perJpy) {
    return null;
  }
  const label = rows[2]?.[config.perJpy.ttsColumn];
  if (typeof label !== "string") {
    return null;
  }
  return /100/.test(label) ? 100 : 1;
};
const parseDailyRates = (rows, year, month, ttsColumn, ttbColumn) => {
  const rates = [];
  for (const row of rows) {
    const day = row[0];
    if (typeof day !== "number" || day < 1 || day > 31) {
      continue;
    }
    const tts = asNumber(row[ttsColumn]);
    const ttb = asNumber(row[ttbColumn]);
    if (tts === null && ttb === null) {
      continue;
    }
    const monthString = String(month).padStart(2, "0");
    const dayString = String(day).padStart(2, "0");
    rates.push({
      date: `${year}-${monthString}-${dayString}`,
      tts,
      ttb
    });
  }
  return rates;
};
const parseMonthlySummary = (rows, ttsColumn) => {
  let high = null;
  let low = null;
  let average = null;
  for (const row of rows) {
    const label = row[0];
    if (typeof label !== "string") {
      continue;
    }
    switch (label) {
      case "\u6700\u9AD8\u5024": {
        high = asNumber(row[ttsColumn]);
        break;
      }
      case "\u6700\u5B89\u5024": {
        low = asNumber(row[ttsColumn]);
        break;
      }
      case "\u5E73\u5747\u5024": {
        average = asNumber(row[ttsColumn]);
        break;
      }
    }
  }
  return {
    high,
    low,
    average
  };
};
const parseMonthSheets = (workbook) => {
  const sheets = [];
  for (const sheetName of monthSheetNames) {
    const sheet = workbook.Sheets[sheetName];
    sheets.push(sheet ? sheetToRows(sheet) : null);
  }
  return sheets;
};
const processAllCurrencies = (monthRows, year, configs, firstSheetRows) => {
  const accumulators = configs.map((config) => ({
    config,
    sourceJa: parseSourceJa(firstSheetRows, config),
    perJpyUnit: parsePerJpyUnit(firstSheetRows, config),
    perUsdRates: [],
    perJpyRates: [],
    monthlySummary: []
  }));
  for (let month = 1; month <= 12; month += 1) {
    const rows = monthRows[month - 1];
    if (!rows) {
      continue;
    }
    for (const accumulator of accumulators) {
      const { config } = accumulator;
      if (config.perUsd) {
        const { ttsColumn, ttbColumn } = config.perUsd;
        accumulator.perUsdRates.push(
          ...parseDailyRates(rows, year, month, ttsColumn, ttbColumn)
        );
      }
      if (config.perJpy) {
        const { ttsColumn, ttbColumn } = config.perJpy;
        accumulator.perJpyRates.push(
          ...parseDailyRates(rows, year, month, ttsColumn, ttbColumn)
        );
      }
      const summaryColumn = config.perUsd?.ttsColumn ?? config.perJpy?.ttsColumn ?? 2;
      const summary = parseMonthlySummary(rows, summaryColumn);
      if (summary.high !== null || summary.low !== null || summary.average !== null) {
        accumulator.monthlySummary.push({
          month,
          ...summary
        });
      }
    }
  }
  const currencies = {};
  for (const accumulator of accumulators) {
    const rates = {};
    if (accumulator.perUsdRates.length > 0) {
      rates.perUsd = accumulator.perUsdRates;
    }
    if (accumulator.perJpyRates.length > 0) {
      rates.perJpy = accumulator.perJpyRates;
    }
    currencies[accumulator.config.code] = {
      sourceJa: accumulator.sourceJa,
      perJpyUnit: rates.perJpy ? accumulator.perJpyUnit : null,
      rates,
      monthlySummary: accumulator.monthlySummary
    };
  }
  return currencies;
};
const tryFetchXls = async (url, options) => {
  try {
    return await fetchXls(url, options);
  } catch (error) {
    if (error instanceof Error && error.message.includes("HTTP 404")) {
      return null;
    }
    throw error;
  }
};
const fetchReference = async (year, options = {}) => {
  if (!Number.isInteger(year)) {
    throw new RangeError(`Invalid year: ${year}`);
  }
  const urlA = `https://www.murc-kawasesouba.jp/fx/ref_rate/a_${year}.xls`;
  const urlB = `https://www.murc-kawasesouba.jp/fx/ref_rate/b_${year}.xls`;
  const [workbookA, workbookB] = await Promise.all([
    tryFetchXls(urlA, options),
    tryFetchXls(urlB, options)
  ]);
  if (!workbookA && !workbookB) {
    return null;
  }
  const source = [];
  let currencies = {};
  if (workbookA) {
    source.push(urlA);
    const monthRows = parseMonthSheets(workbookA);
    const firstSheetRows = monthRows[0] ?? sheetToRows(getSheet(workbookA, monthSheetNames[0]));
    currencies = {
      ...currencies,
      ...processAllCurrencies(monthRows, year, groupAConfig, firstSheetRows)
    };
  }
  if (workbookB) {
    source.push(urlB);
    const monthRows = parseMonthSheets(workbookB);
    const firstSheetRows = monthRows[0] ?? sheetToRows(getSheet(workbookB, monthSheetNames[0]));
    currencies = {
      ...currencies,
      ...processAllCurrencies(monthRows, year, groupBConfig, firstSheetRows)
    };
  }
  return {
    source,
    year,
    currencies
  };
};

export { fetchReference as f };
