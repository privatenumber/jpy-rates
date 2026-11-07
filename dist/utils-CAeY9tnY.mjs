import { f as formatDate } from './date-Ch1m7K65.mjs';

const parseUnit = (text) => {
  const trimmed = text.trim();
  if (trimmed === "100unit") {
    return 100;
  }
  return 1;
};
const cleanCellText = (text) => text.replace(/[*＊\s]+$/u, "").trim();
const computeTtm = (tts, ttb) => {
  if (tts === null || ttb === null) {
    return null;
  }
  return Math.round((tts + ttb) / 2 * 100) / 100;
};
const ratePattern = /^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/;
const parseRate = (text) => {
  const trimmed = text.trim();
  if (!ratePattern.test(trimmed)) {
    return null;
  }
  return Number(trimmed.replaceAll(",", ""));
};
const formatDateId = (date) => formatDate(date).slice(2).replaceAll("-", "");

export { computeTtm as a, parseUnit as b, cleanCellText as c, formatDateId as f, parseRate as p };
