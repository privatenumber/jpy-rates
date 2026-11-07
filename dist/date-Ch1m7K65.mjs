const formatDate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};
const japanOffsetMilliseconds = 9 * 60 * 60 * 1e3;
const getTodayInJapan = () => parseDate(
  formatDate(new Date(Date.now() + japanOffsetMilliseconds))
);
const isMidnightLocal = (date) => date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
const isMidnightUtc = (date) => date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0;
const parseDate = (input) => {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new TypeError("Invalid Date");
    }
    if (isMidnightLocal(input)) {
      return new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()));
    }
    if (isMidnightUtc(input)) {
      return new Date(input);
    }
    throw new Error(
      "Ambiguous Date input \u2014 cannot determine calendar date. Pass a YYYY-MM-DD string, new Date(year, month, day), or new Date('YYYY-MM-DD')."
    );
  }
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid date format: ${input} (expected YYYY-MM-DD)`);
  }
  const [, ys, ms, ds] = match;
  const date = new Date(Date.UTC(Number(ys), Number(ms) - 1, Number(ds)));
  if (formatDate(date) !== input) {
    throw new Error(`Invalid date: ${input}`);
  }
  return date;
};
const assertDateInRange = (date, earliest) => {
  const dateString = formatDate(date);
  if (dateString < earliest) {
    throw new RangeError(`Date ${dateString} is before the earliest available date ${earliest}`);
  }
  const today = formatDate(getTodayInJapan());
  if (dateString > today) {
    throw new RangeError(`Date ${dateString} is in the future (today in Japan is ${today})`);
  }
};
const maxWalkbackDays = 14;
const findPrecedingBusinessDay = async (date, fetchForDate) => {
  for (let attempt = 0; attempt < maxWalkbackDays; attempt += 1) {
    const result = await fetchForDate(addDays(date, -attempt));
    if (result) {
      return result;
    }
  }
  return null;
};

export { assertDateInRange as a, findPrecedingBusinessDay as b, formatDate as f, getTodayInJapan as g, parseDate as p };
