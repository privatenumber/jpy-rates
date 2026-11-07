import { s as statMonth, f as fetchSeries, a as statAttribution } from './stat-api-CH6LPDbX.mjs';

const dailyCodes = {
  at0900: "FXERD01",
  at1700: "FXERD04",
  center: "FXERD05",
  high: "FXERD02",
  low: "FXERD03"
};
const monthlyCodes = {
  averageAt1700: "FXERM07",
  averageCenter: "FXERM09",
  endAt1700: "FXERM06",
  endCenter: "FXERM08",
  high: "FXERM03",
  low: "FXERM05"
};
const formatSurveyDate = (date) => {
  const text = String(date);
  return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
};
const fetchDailyMarketRates = async (year, month, options) => {
  const requested = statMonth(year, month, "1998-01");
  const result = await fetchSeries("FM08", Object.values(dailyCodes), requested.period, options);
  if (!result) {
    return null;
  }
  const value = (key, date) => result.series[dailyCodes[key]].values.get(date) ?? null;
  const days = [];
  for (const date of result.series[dailyCodes.center].values.keys()) {
    const day = {
      date: formatSurveyDate(date),
      at0900: value("at0900", date),
      at1700: value("at1700", date),
      center: value("center", date),
      high: value("high", date),
      low: value("low", date)
    };
    if ([day.at0900, day.at1700, day.center, day.high, day.low].some((rate) => rate !== null)) {
      days.push(day);
    }
  }
  if (days.length === 0) {
    return null;
  }
  return {
    source: result.source,
    attribution: statAttribution,
    month: requested.month,
    days
  };
};
const fetchMonthlyMarketRates = async (year, month, options) => {
  const requested = statMonth(year, month, "1973-01");
  const result = await fetchSeries("FM08", Object.values(monthlyCodes), requested.period, options);
  if (!result) {
    return null;
  }
  const date = Number(requested.period);
  const value = (key) => result.series[monthlyCodes[key]].values.get(date) ?? null;
  const keys = Object.keys(monthlyCodes);
  if (keys.every((key) => value(key) === null)) {
    return null;
  }
  return {
    source: result.source,
    attribution: statAttribution,
    month: requested.month,
    average: {
      at1700: value("averageAt1700"),
      center: value("averageCenter")
    },
    end: {
      at1700: value("endAt1700"),
      center: value("endCenter")
    },
    high: value("high"),
    low: value("low")
  };
};

export { fetchMonthlyMarketRates as a, fetchDailyMarketRates as f };
