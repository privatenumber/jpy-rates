import type { FetchOptions } from '../utils/fetch-source.ts';
import { fetchSeries, statAttribution, statMonth } from './stat-api.ts';
import type { EffectiveRatesResult } from './types.ts';

const nominalCode = 'FX180110001';
const realCode = 'FX180110002';

/**
 * The yen's nominal and real effective exchange rate indices for a month.
 * Returns null when the BOJ has not published the month yet; the real index
 * is published about a month after the month ends.
 */
export const fetchEffectiveRates = async (
	year: number,
	month: number,
	options?: FetchOptions,
): Promise<EffectiveRatesResult | null> => {
	const requested = statMonth(year, month, '1970-01');
	const result = await fetchSeries('FM09', [nominalCode, realCode], requested.period, options);
	if (!result) { return null; }

	const date = Number(requested.period);
	const nominal = result.series[nominalCode]!;
	const real = result.series[realCode]!;
	const nominalValue = nominal.values.get(date) ?? null;
	const realValue = real.values.get(date) ?? null;
	if (nominalValue === null && realValue === null) { return null; }
	return {
		source: result.source,
		attribution: statAttribution,
		month: requested.month,
		base: nominal.unit,
		nominal: nominalValue,
		real: realValue,
	};
};
