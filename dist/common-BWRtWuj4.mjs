import { r as rateSources } from './sources-DwUUADTL.mjs';
import { f as formatDate, g as getTodayInJapan } from './date-Ch1m7K65.mjs';

const { attribution } = rateSources.find((source) => source.id === "boj");
const baseUrl = "https://www.boj.or.jp/about/services/tame/tame_rate";
const isUnannounced = (response, month) => response.status === 404 && month > formatDate(getTodayInJapan()).slice(0, 7);
const monthParts = (year, month) => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${year}-${String(month).padStart(2, "0")}`);
  }
  if (year < 2016 || year > 2099) {
    throw new RangeError("Month must be between 2016-01 and 2099-12");
  }
  const paddedMonth = String(month).padStart(2, "0");
  return {
    month: `${year}-${paddedMonth}`,
    suffix: `${String(year).slice(-2)}${paddedMonth}`
  };
};
const japaneseMonth = (text) => {
  const match = text.normalize("NFKC").match(/(令和|平成)(元|\d+)年\s*(\d+)月/);
  if (!match) {
    return void 0;
  }
  const year = (match[1] === "\u4EE4\u548C" ? 2018 : 1988) + (match[2] === "\u5143" ? 1 : Number(match[2]));
  return `${year}-${match[3].padStart(2, "0")}`;
};

export { attribution as a, baseUrl as b, isUnannounced as i, japaneseMonth as j, monthParts as m };
