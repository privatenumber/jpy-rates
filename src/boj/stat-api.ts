import { rateSources } from '../guide/sources.ts';
import { fetchSource, type FetchOptions } from '../utils/fetch-source.ts';

// BOJ Time-Series Data Search API. No key is required; see
// https://www.stat-search.boj.or.jp/ssi/docs/info/api_notice.pdf for the terms.
export const statAttribution = rateSources.find(source => source.id === 'boj-stat')!.attribution;

const endpoint = 'https://www.stat-search.boj.or.jp/api/v1/getDataCode';

// Success with no data, such as an unpublished or future period
const noDataMessageId = 'M181030I';

type ApiResponse = {
	STATUS: number;
	MESSAGEID: string;
	MESSAGE: string;
	RESULTSET?: {
		SERIES_CODE: string;
		UNIT?: string;
		VALUES: {
			SURVEY_DATES: number[];
			VALUES: (number | null)[];
		};
	}[];
};

export type Series = {
	unit: string;

	/** Values keyed by survey date: YYYYMMDD for daily series, YYYYMM for monthly series */
	values: Map<number, number | null>;
};

export type SeriesResult = {
	source: string;
	series: Record<string, Series>;
};

/**
 * Fetches series of one frequency for one period in a single request.
 * `period` is YYYYMM for both daily and monthly series.
 */
export const fetchSeries = async (
	database: string,
	codes: string[],
	period: string,
	options?: FetchOptions,
): Promise<SeriesResult | null> => {
	const url = new URL(endpoint);
	url.search = new URLSearchParams({
		format: 'json',
		lang: 'en',
		db: database,
		startDate: period,
		endDate: period,
		code: codes.join(','),
	}).toString();
	const source = url.href;
	const response = await fetchSource(source, options);

	// Errors are JSON too, such as {"STATUS":400,"MESSAGE":"Nonexistent series code：1"}
	const body = await response.json().catch(() => undefined) as ApiResponse | undefined;
	if (!response.ok || body?.STATUS !== 200) {
		throw new Error(`BOJ API error (HTTP ${response.status}): ${body?.MESSAGE ?? 'unreadable response'}: ${source}`);
	}
	if (body.MESSAGEID === noDataMessageId) { return null; }

	const series: Record<string, Series> = {};
	for (const entry of body.RESULTSET ?? []) {
		const { SURVEY_DATES: dates, VALUES: values } = entry.VALUES;
		series[entry.SERIES_CODE] = {
			unit: entry.UNIT ?? '',
			values: new Map(dates.map((date, index) => [date, values[index] ?? null])),
		};
	}
	const missing = codes.filter(code => !series[code]);
	if (missing.length > 0) {
		throw new Error(`BOJ API response is missing series ${missing.join(', ')}: ${source}`);
	}
	return {
		source,
		series,
	};
};

export const statMonth = (year: number, month: number, earliest: string) => {
	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		throw new RangeError(`Invalid month: ${year}-${month}`);
	}
	const paddedMonth = String(month).padStart(2, '0');
	const formatted = `${year}-${paddedMonth}`;
	if (formatted < earliest || year > 2099) {
		throw new RangeError(`Month must be between ${earliest} and 2099-12`);
	}
	return {
		month: formatted,
		period: `${year}${paddedMonth}`,
	};
};
