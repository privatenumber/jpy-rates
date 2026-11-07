import { r as rateSources } from './sources-DwUUADTL.mjs';
import { f as fetchSource } from './fetch-source-BHAj9IoI.mjs';

const statAttribution = rateSources.find((source) => source.id === "boj-stat").attribution;
const endpoint = "https://www.stat-search.boj.or.jp/api/v1/getDataCode";
const noDataMessageId = "M181030I";
const parseValues = (entry, period, source) => {
  const dates = entry.VALUES?.SURVEY_DATES;
  const values = entry.VALUES?.VALUES;
  const fail = (detail) => new Error(
    `Unexpected BOJ API values for ${entry.SERIES_CODE} (${detail}): ${source}`
  );
  if (!Array.isArray(dates) || !Array.isArray(values) || dates.length !== values.length) {
    throw fail("missing or mismatched arrays");
  }
  const pairs = [];
  for (const [index, date] of dates.entries()) {
    if (typeof date !== "number" || !String(date).startsWith(period)) {
      throw fail(`date ${String(date)} outside ${period}`);
    }
    const value = values[index];
    if (value !== null && !(typeof value === "number" && Number.isFinite(value))) {
      throw fail(`value ${JSON.stringify(value)} on ${date}`);
    }
    pairs.push([date, value]);
  }
  if (pairs.length === 0) {
    throw fail(`no dates for ${period}`);
  }
  return new Map(pairs.sort(([a], [b]) => a - b));
};
const fetchSeries = async (database, codes, period, options) => {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({
    format: "json",
    lang: "en",
    db: database,
    startDate: period,
    endDate: period,
    code: codes.join(",")
  }).toString();
  const source = url.href;
  const response = await fetchSource(source, options);
  const body = await response.json().catch(() => {
    options?.signal?.throwIfAborted();
    return void 0;
  });
  if (!response.ok || body?.STATUS !== 200) {
    throw new Error(`BOJ API error (HTTP ${response.status}): ${body?.MESSAGE ?? "unreadable response"}: ${source}`);
  }
  if (body.MESSAGEID === noDataMessageId) {
    return null;
  }
  const series = {};
  for (const entry of body.RESULTSET ?? []) {
    series[entry.SERIES_CODE] = {
      unit: entry.UNIT ?? "",
      values: parseValues(entry, period, source)
    };
  }
  const missing = codes.filter((code) => !series[code]);
  if (missing.length > 0) {
    throw new Error(`BOJ API response is missing series ${missing.join(", ")}: ${source}`);
  }
  return {
    source,
    series
  };
};
const statMonth = (year, month, earliest) => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Invalid month: ${year}-${String(month).padStart(2, "0")}`);
  }
  const paddedMonth = String(month).padStart(2, "0");
  const [earliestYear, earliestMonth] = earliest.split("-").map(Number);
  if (year * 12 + month < earliestYear * 12 + earliestMonth || year > 2099) {
    throw new RangeError(`Month must be between ${earliest} and 2099-12`);
  }
  const formatted = `${year}-${paddedMonth}`;
  return {
    month: formatted,
    period: `${year}${paddedMonth}`
  };
};

export { statAttribution as a, fetchSeries as f, statMonth as s };
