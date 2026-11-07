import { f as formatDate, b as findPrecedingBusinessDay, g as getTodayInJapan } from './date-Ch1m7K65.mjs';

const findRatesOnOrBefore = async (date, fetchForDate, today = getTodayInJapan()) => {
  const weekday = date.getUTCDay();
  if (formatDate(date) !== formatDate(today) || weekday === 0 || weekday === 6) {
    return findPrecedingBusinessDay(date, fetchForDate);
  }
  const result = await fetchForDate(date);
  if (result) {
    return result;
  }
  throw new Error(`MURC has not published rates for today (${formatDate(date)}) yet. Rates are updated after about 11:00 JST. If today is a bank holiday, pass the previous business day.`);
};

const historicalHundredUnitCurrencies = /* @__PURE__ */ new Set(["BEF", "ESP", "ITL"]);
const normalizeDailyRateCode = (code, name, nameJa) => {
  if (code === "\u30B3\u30DE\u30FC\u30B7\u30E3\u30EB" && (name === "Belgian Franc" || nameJa === "\u30D9\u30EB\u30AE\u30FC\u30FB\u30D5\u30E9\u30F3")) {
    return "BEF";
  }
  return code;
};
const getDailyRateUnit = (code, year) => {
  if (code === "IDR" || code === "KRW") {
    return 100;
  }
  if (historicalHundredUnitCurrencies.has(code) && year <= 2001) {
    return 100;
  }
  if (code === "MXP" && year <= 1992) {
    return 100;
  }
  return 1;
};

export { findRatesOnOrBefore as f, getDailyRateUnit as g, normalizeDailyRateCode as n };
