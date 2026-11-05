import { fetchRates } from './fetch-rates.ts';
import { formatDate, parseDate } from './utils.ts';
import type {
	ConvertCurrencyOptions, ConvertCurrencyResult, ConversionRateType,
	ConvertWithRatesOptions, ConvertWithRatesResult, RatesResult,
} from './types.ts';

const supportedRateTypes = new Set<ConversionRateType>(['tts', 'ttb', 'ttm']);

const normalizeOptions = (options: ConvertWithRatesOptions) => {
	if (!Number.isFinite(options.amount)) {
		throw new TypeError(`Invalid amount: ${options.amount}`);
	}

	const from = options.from.trim().toUpperCase();
	const to = options.to.trim().toUpperCase();
	const rate = options.rate ?? 'ttm';
	if (!supportedRateTypes.has(rate)) {
		throw new Error(`Invalid rate: ${rate} (expected tts, ttb, or ttm)`);
	}

	const convertsFromJpy = from === 'JPY';
	if (Number(convertsFromJpy) + Number(to === 'JPY') !== 1) {
		throw new Error('Conversion only supports JPY and one foreign currency');
	}

	return {
		amount: options.amount,
		from,
		to,
		rate,
		convertsFromJpy,
	};
};

const convert = (
	ratesResult: RatesResult,
	{
		amount, from, to, rate, convertsFromJpy,
	}: ReturnType<typeof normalizeOptions>,
): ConvertWithRatesResult => {
	const currency = convertsFromJpy ? to : from;
	const quote = Object.hasOwn(ratesResult.rates, currency)
		? ratesResult.rates[currency]
		: undefined;
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

	const convertedAmount = convertsFromJpy
		? (amount / rateValue) * quote.unit
		: (amount * rateValue) / quote.unit;

	return {
		source: ratesResult.source,
		sourceDate: ratesResult.date,
		amount,
		from,
		to,
		rate,
		rateValue,
		unit: quote.unit,
		convertedAmount,
	};
};

/**
 * Convert between JPY and one foreign currency using an already-fetched
 * `fetchRates()` result. Useful for converting many amounts with one quote.
 */
export const convertWithRates = (
	ratesResult: RatesResult,
	options: ConvertWithRatesOptions,
): ConvertWithRatesResult => convert(ratesResult, normalizeOptions(options));

export const convertCurrency = async (
	options: ConvertCurrencyOptions,
): Promise<ConvertCurrencyResult | null> => {
	const normalized = normalizeOptions(options);
	const requestedDate = parseDate(options.date);
	const ratesResult = await fetchRates(requestedDate, { signal: options.signal });
	if (!ratesResult) {
		return null;
	}

	return {
		...convert(ratesResult, normalized),
		requestedDate: formatDate(requestedDate),
	};
};
