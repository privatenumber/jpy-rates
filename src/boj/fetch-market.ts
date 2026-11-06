import type { FetchOptions } from '../utils/fetch-source.ts';
import { fetchSeries, statAttribution, statMonth } from './stat-api.ts';
import type { DailyMarketRate, DailyMarketRatesResult, MonthlyMarketRatesResult } from './types.ts';

const dailyCodes = {
	at0900: 'FXERD01',
	at1700: 'FXERD04',
	center: 'FXERD05',
	high: 'FXERD02',
	low: 'FXERD03',
} as const;

const monthlyCodes = {
	averageAt1700: 'FXERM07',
	averageCenter: 'FXERM09',
	endAt1700: 'FXERM06',
	endCenter: 'FXERM08',
	high: 'FXERM03',
	low: 'FXERM05',
} as const;

const formatSurveyDate = (date: number): string => {
	const text = String(date);
	return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
};

/**
 * Tokyo interbank USD/JPY spot rates for each trading day of a month, in JPY per USD.
 * Returns null when the BOJ has published no data for the month yet.
 */
export const fetchDailyMarketRates = async (
	year: number,
	month: number,
	options?: FetchOptions,
): Promise<DailyMarketRatesResult | null> => {
	// The 17:00 series starts on 1998-01-05; the other daily series start in 1999
	const requested = statMonth(year, month, '1998-01');
	const result = await fetchSeries('FM08', Object.values(dailyCodes), requested.period, options);
	if (!result) { return null; }

	const value = (key: keyof typeof dailyCodes, date: number) => (
		result.series[dailyCodes[key]]!.values.get(date) ?? null
	);
	const days: DailyMarketRate[] = [];
	for (const date of result.series[dailyCodes.center]!.values.keys()) {
		const day: DailyMarketRate = {
			date: formatSurveyDate(date),
			at0900: value('at0900', date),
			at1700: value('at1700', date),
			center: value('center', date),
			high: value('high', date),
			low: value('low', date),
		};
		// Weekends, holidays, and unpublished days are listed with no values
		if ([day.at0900, day.at1700, day.center, day.high, day.low].some(rate => rate !== null)) {
			days.push(day);
		}
	}
	if (days.length === 0) { return null; }
	return {
		source: result.source,
		attribution: statAttribution,
		month: requested.month,
		days,
	};
};

/**
 * Monthly summary of Tokyo interbank USD/JPY spot rates, in JPY per USD.
 * Returns null when the BOJ has not published the month yet.
 */
export const fetchMonthlyMarketRates = async (
	year: number,
	month: number,
	options?: FetchOptions,
): Promise<MonthlyMarketRatesResult | null> => {
	// The 17:00 series starts in 1973-01; center, high, and low start in 1992-08
	const requested = statMonth(year, month, '1973-01');
	const result = await fetchSeries('FM08', Object.values(monthlyCodes), requested.period, options);
	if (!result) { return null; }

	const date = Number(requested.period);
	const value = (key: keyof typeof monthlyCodes) => (
		result.series[monthlyCodes[key]]!.values.get(date) ?? null
	);
	// The current month is listed with no values until it ends
	const keys = Object.keys(monthlyCodes) as (keyof typeof monthlyCodes)[];
	if (keys.every(key => value(key) === null)) { return null; }
	return {
		source: result.source,
		attribution: statAttribution,
		month: requested.month,
		average: {
			at1700: value('averageAt1700'),
			center: value('averageCenter'),
		},
		end: {
			at1700: value('endAt1700'),
			center: value('endCenter'),
		},
		high: value('high'),
		low: value('low'),
	};
};
