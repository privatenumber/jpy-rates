import {
	formatDate, parseDate,
} from '../utils/date.ts';
import { multiplyDecimals } from '../utils/number.ts';
import { fetchRates } from './fetch-rates.ts';
import { rateTypeForPurpose } from './conversion-purpose.ts';
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
	if (options.rate !== undefined && options.purpose !== undefined) {
		throw new TypeError('Pass either rate or purpose, not both');
	}
	const purpose = options.purpose ?? null;
	// An empty purpose is validated (and rejected) rather than treated as absent
	const rate = purpose === null ? (options.rate ?? 'ttm') : rateTypeForPurpose(purpose);
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
		purpose,
		convertsFromJpy,
	};
};

const convert = (
	ratesResult: RatesResult,
	{
		amount, from, to, rate, purpose, convertsFromJpy,
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

	// Units are powers of ten (1 or 100), so dividing by a unit is an exact decimal factor
	const convertedAmount = convertsFromJpy
		? (amount / rateValue) * quote.unit
		: multiplyDecimals(amount, rateValue, 1 / quote.unit);

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
