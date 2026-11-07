import { s as statMonth, f as fetchSeries, a as statAttribution } from './stat-api-CH6LPDbX.mjs';

const nominalCode = "FX180110001";
const realCode = "FX180110002";
const fetchEffectiveRates = async (year, month, options) => {
  const requested = statMonth(year, month, "1970-01");
  const result = await fetchSeries("FM09", [nominalCode, realCode], requested.period, options);
  if (!result) {
    return null;
  }
  const date = Number(requested.period);
  const nominal = result.series[nominalCode];
  const real = result.series[realCode];
  const nominalValue = nominal.values.get(date) ?? null;
  const realValue = real.values.get(date) ?? null;
  if (nominalValue === null && realValue === null) {
    return null;
  }
  return {
    source: result.source,
    attribution: statAttribution,
    month: requested.month,
    base: nominal.unit,
    nominal: nominalValue,
    real: realValue
  };
};

export { fetchEffectiveRates as f };
