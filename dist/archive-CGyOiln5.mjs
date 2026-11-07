import { f as fetchSource } from './fetch-source-BHAj9IoI.mjs';
import { p as parseXlsBuffer, g as getSheet, s as sheetToRows, e as excelDateToIso } from './parse-xls-ZcOCCVSl.mjs';

const validateArchiveYear = (year) => {
  if (!Number.isInteger(year) || year < 1990) {
    throw new Error(`Invalid archive year: ${year} (expected an integer from 1990)`);
  }
};
const getArchiveSourceUrl = (year) => {
  validateArchiveYear(year);
  return `https://www.murc-kawasesouba.jp/fx/xls/murc_${year}.xls`;
};
const downloadArchiveSource = async (year, options = {}) => {
  const url = getArchiveSourceUrl(year);
  const response = await fetchSource(url, options);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  return response.arrayBuffer();
};
const parseCurrencyList = (headerRow, noteRow = []) => {
  const currencies = [];
  for (let column = 2; column < headerRow.length; column += 3) {
    const cell = headerRow[column];
    if (typeof cell !== "string" || !cell.trim()) {
      continue;
    }
    const match = cell.match(/[（(]([A-Z]{3})[）)]/);
    if (match) {
      const note = noteRow[column];
      currencies.push({
        code: match[1],
        unit: typeof note === "string" && note.includes("100\u901A\u8CA8\u5358\u4F4D") ? 100 : 1,
        ttsColumn: column
      });
    }
  }
  return currencies;
};
const parseDailyData = (rows, currencies) => {
  const dailyMap = /* @__PURE__ */ new Map();
  for (const currency of currencies) {
    dailyMap.set(currency.code, []);
  }
  for (let rowIndex = 3; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const dateSerial = row[0];
    if (typeof dateSerial !== "number") {
      continue;
    }
    const firstTts = row[2];
    if (typeof firstTts !== "number") {
      continue;
    }
    const date = excelDateToIso(dateSerial);
    for (const currency of currencies) {
      const tts = row[currency.ttsColumn];
      const ttb = row[currency.ttsColumn + 1];
      const ttm = row[currency.ttsColumn + 2];
      if (typeof tts !== "number" || typeof ttb !== "number" || typeof ttm !== "number") {
        continue;
      }
      dailyMap.get(currency.code).push({
        date,
        tts,
        ttb,
        ttm
      });
    }
  }
  return dailyMap;
};
const inferArchiveYear = (dailyMap) => {
  for (const dailyRates of dailyMap.values()) {
    const firstDate = dailyRates[0]?.date;
    if (firstDate) {
      const year = Number(firstDate.slice(0, 4));
      validateArchiveYear(year);
      return year;
    }
  }
  throw new Error("Could not infer archive year from workbook dates");
};
const emptyAnnualSummary = () => ({
  high: null,
  low: null,
  average: null
});
const parseSummaryLabel = (text) => {
  const label = text.normalize("NFKC").replaceAll(/[※*]/gu, "");
  if (label === "\u9AD8\u5024" || label === "\u6700\u9AD8\u5024") {
    return "high";
  }
  if (label === "\u5B89\u5024" || label === "\u6700\u4F4E\u5024") {
    return "low";
  }
  if (label === "\u5E73\u5747" || label === "\u5E73\u5747\u5024") {
    return "average";
  }
  return null;
};
const extractRowValues = (row, ttsPositions, currencies) => {
  const values = /* @__PURE__ */ new Map();
  for (let index = 0; index < currencies.length; index += 1) {
    const currency = currencies[index];
    const ttsColumn = ttsPositions[index];
    if (ttsColumn === void 0) {
      continue;
    }
    const ttmColumn = ttsColumn + 2;
    const value = row[ttmColumn];
    if (typeof value === "number" && value > 0) {
      values.set(currency.code, value);
    }
  }
  return values;
};
const parseMonthlySummarySheet = (rows, ttsPositions, currencies) => {
  const monthlyMap = /* @__PURE__ */ new Map();
  const annualMap = /* @__PURE__ */ new Map();
  for (const currency of currencies) {
    monthlyMap.set(currency.code, []);
    annualMap.set(currency.code, emptyAnnualSummary());
  }
  let currentMonth = 0;
  const monthHighs = /* @__PURE__ */ new Map();
  const monthLows = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const cell0 = row[0];
    const cell1 = row[1];
    if (typeof cell0 === "string") {
      const monthMatch = cell0.normalize("NFKC").match(/^(\d{1,2})月$/);
      if (monthMatch) {
        currentMonth = Number(monthMatch[1]);
        monthHighs.clear();
        monthLows.clear();
      }
      if (cell0 === "\u5E74\u9593") {
        currentMonth = 0;
        monthHighs.clear();
        monthLows.clear();
      }
    }
    if (typeof cell1 !== "string") {
      continue;
    }
    const summaryLabel = parseSummaryLabel(cell1);
    if (!summaryLabel) {
      continue;
    }
    const rowValues = extractRowValues(row, ttsPositions, currencies);
    if (summaryLabel === "high") {
      for (const [code, value] of rowValues) {
        monthHighs.set(code, value);
      }
    } else if (summaryLabel === "low") {
      for (const [code, value] of rowValues) {
        monthLows.set(code, value);
      }
    } else {
      for (const { code } of currencies) {
        const summary = {
          high: monthHighs.get(code) ?? null,
          low: monthLows.get(code) ?? null,
          average: rowValues.get(code) ?? null
        };
        if (summary.high === null && summary.low === null && summary.average === null) {
          continue;
        }
        if (currentMonth > 0) {
          monthlyMap.get(code).push({
            month: currentMonth,
            ...summary
          });
        } else {
          annualMap.set(code, summary);
        }
      }
    }
  }
  return {
    monthly: monthlyMap,
    annual: annualMap
  };
};
const parseFuzzyLabel = (label) => {
  if (label.includes("\u5E73\u5747")) {
    return "average";
  }
  if (label.includes("\u9AD8")) {
    return "high";
  }
  if (label.includes("\u5B89")) {
    return "low";
  }
  return null;
};
const parseAverageAnnualSection = (rows, startIndex, ttsPositions, currencies, annualMap) => {
  const annualHighMap = /* @__PURE__ */ new Map();
  const annualLowMap = /* @__PURE__ */ new Map();
  const annualAverageMap = /* @__PURE__ */ new Map();
  for (let scanIndex = startIndex; scanIndex < rows.length; scanIndex += 1) {
    const scanRow = rows[scanIndex];
    const label = scanRow[0];
    if (typeof label !== "string") {
      continue;
    }
    const fuzzyLabel = parseFuzzyLabel(label);
    if (!fuzzyLabel) {
      continue;
    }
    const rowValues = extractRowValues(scanRow, ttsPositions, currencies);
    const targetMaps = {
      average: annualAverageMap,
      high: annualHighMap,
      low: annualLowMap
    };
    const targetMap = targetMaps[fuzzyLabel];
    for (const [code, value] of rowValues) {
      targetMap.set(code, value);
    }
  }
  for (const currency of currencies) {
    annualMap.set(currency.code, {
      high: annualHighMap.get(currency.code) ?? null,
      low: annualLowMap.get(currency.code) ?? null,
      average: annualAverageMap.get(currency.code) ?? null
    });
  }
};
const parseAverageSummarySheet = (rows, currencies) => {
  const monthlyMap = /* @__PURE__ */ new Map();
  const annualMap = /* @__PURE__ */ new Map();
  for (const currency of currencies) {
    monthlyMap.set(currency.code, []);
    annualMap.set(currency.code, emptyAnnualSummary());
  }
  const ttsPositions = [];
  for (let index = 0; index < currencies.length; index += 1) {
    ttsPositions.push(1 + index * 3);
  }
  for (let rowIndex = 3; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const cell0 = row[0];
    if (typeof cell0 === "number") {
      const dateString = excelDateToIso(cell0);
      const month = Number(dateString.split("-")[1]);
      const rowValues = extractRowValues(row, ttsPositions, currencies);
      for (const [code, average] of rowValues) {
        monthlyMap.get(code).push({
          month,
          high: null,
          low: null,
          average
        });
      }
    } else if (typeof cell0 === "string") {
      parseAverageAnnualSection(rows, rowIndex, ttsPositions, currencies, annualMap);
      break;
    }
  }
  return {
    monthly: monthlyMap,
    annual: annualMap
  };
};
const parseArchiveWorkbook = async (input, options = {}) => {
  const workbook = await parseXlsBuffer(input);
  const dataSheet = getSheet(workbook, "data");
  const dataRows = sheetToRows(dataSheet);
  const currencies = parseCurrencyList(dataRows[0], dataRows[1]);
  const dailyMap = parseDailyData(dataRows, currencies);
  const year = inferArchiveYear(dailyMap);
  const sheetNames = workbook.SheetNames;
  const monthlySheetName = sheetNames.find(
    (name) => name === "\u6708\u6BCE" || name === "\u6708\u6BCEHLA"
  );
  let summaryResult;
  if (monthlySheetName) {
    const monthlySheet = getSheet(workbook, monthlySheetName);
    const monthlyRows = sheetToRows(monthlySheet);
    const headerIndex = monthlyRows.findIndex(
      (row) => row?.includes("TTS")
    );
    const headerRow = monthlyRows[headerIndex === -1 ? 3 : headerIndex];
    const ttsPositions = [];
    for (let column = 0; column < headerRow.length; column += 1) {
      if (headerRow[column] === "TTS") {
        ttsPositions.push(column);
      }
    }
    summaryResult = parseMonthlySummarySheet(monthlyRows, ttsPositions, currencies);
  } else {
    const averageSheet = getSheet(workbook, "average");
    const averageRows = sheetToRows(averageSheet);
    summaryResult = parseAverageSummarySheet(averageRows, currencies);
  }
  const currencyRecords = {};
  for (const currency of currencies) {
    currencyRecords[currency.code] = {
      unit: currency.unit,
      daily: dailyMap.get(currency.code) ?? [],
      monthly: summaryResult.monthly.get(currency.code) ?? [],
      annual: summaryResult.annual.get(currency.code) ?? emptyAnnualSummary()
    };
  }
  return {
    source: options.sourceUrl ?? null,
    year,
    currencies: currencyRecords
  };
};

export { downloadArchiveSource as d, getArchiveSourceUrl as g, parseArchiveWorkbook as p };
