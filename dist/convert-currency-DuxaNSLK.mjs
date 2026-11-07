import { p as parseDate, f as formatDate } from './date-Ch1m7K65.mjs';
import { m as multiplyDecimals } from './number-DrM6UAah.mjs';
import { f as fetchRates } from './fetch-rates-DEapXvMJ.mjs';

const purposeRateTypes = {
  // 所得税基本通達57の3-2: TTM on the transaction date
  general: "ttm",
  // 措置法通達37の10・37の11共-6: sale proceeds at TTB, acquisition cost at TTS
  "stock-sale": "ttb",
  "stock-acquisition": "tts",
  // 措置法通達9の2-2: TTB on the payment start date
  dividend: "ttb",
  // 財産評価基本通達4-3: assets at TTB, debts at TTS
  "inheritance-asset": "ttb",
  "inheritance-debt": "tts",
  // 国外送金等調書法通達5-14: TTB on December 31
  "foreign-asset-report": "ttb"
};
const conversionPurposes = Object.keys(purposeRateTypes);
const rateTypeForPurpose = (purpose) => {
  if (!Object.hasOwn(purposeRateTypes, purpose)) {
    throw new TypeError(`Invalid purpose: ${purpose} (expected ${conversionPurposes.join(", ")})`);
  }
  return purposeRateTypes[purpose];
};

const supportedRateTypes = /* @__PURE__ */ new Set(["tts", "ttb", "ttm"]);
const normalizeOptions = (options) => {
  if (!Number.isFinite(options.amount)) {
    throw new TypeError(`Invalid amount: ${options.amount}`);
  }
  const from = options.from.trim().toUpperCase();
  const to = options.to.trim().toUpperCase();
  if (options.rate !== void 0 && options.purpose !== void 0) {
    throw new TypeError("Pass either rate or purpose, not both");
  }
  const purpose = options.purpose ?? null;
  const rate = purpose === null ? options.rate ?? "ttm" : rateTypeForPurpose(purpose);
  if (!supportedRateTypes.has(rate)) {
    throw new Error(`Invalid rate: ${rate} (expected tts, ttb, or ttm)`);
  }
  const convertsFromJpy = from === "JPY";
  if (Number(convertsFromJpy) + Number(to === "JPY") !== 1) {
    throw new Error("Conversion only supports JPY and one foreign currency");
  }
  return {
    amount: options.amount,
    from,
    to,
    rate,
    purpose,
    convertsFromJpy
  };
};
const convert = (ratesResult, {
  amount,
  from,
  to,
  rate,
  purpose,
  convertsFromJpy
}) => {
  const currency = convertsFromJpy ? to : from;
  const quote = Object.hasOwn(ratesResult.rates, currency) ? ratesResult.rates[currency] : void 0;
  if (!quote) {
    throw new Error(`Currency ${currency} not found in rates for ${ratesResult.date}`);
  }
  const rateValue = quote[rate];
  if (rateValue === null) {
    throw new Error(`Currency ${currency} has no ${rate.toUpperCase()} rate for ${ratesResult.date}`);
  }
  if (!Number.isFinite(rateValue) || rateValue <= 0) {
    throw new Error(`Currency ${currency} has an invalid ${rate.toUpperCase()} rate (${rateValue}) for ${ratesResult.date}`);
  }
  const convertedAmount = convertsFromJpy ? amount / rateValue * quote.unit : multiplyDecimals(amount, rateValue, 1 / quote.unit);
  return {
    source: ratesResult.source,
    sourceDate: ratesResult.date,
    amount,
    from,
    to,
    rate,
    purpose,
    rateValue,
    unit: quote.unit,
    convertedAmount
  };
};
const convertWithRates = (ratesResult, options) => convert(ratesResult, normalizeOptions(options));
const convertCurrency = async (options) => {
  const normalized = normalizeOptions(options);
  const requestedDate = parseDate(options.date);
  const ratesResult = await fetchRates(requestedDate, { signal: options.signal });
  if (!ratesResult) {
    return null;
  }
  return {
    ...convert(ratesResult, normalized),
    requestedDate: formatDate(requestedDate)
  };
};

export { convertCurrency as a, convertWithRates as b, conversionPurposes as c, rateTypeForPurpose as r };
