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
	RESULTSET?: ApiSeries[];
};

// Fields are typed as unknown because they are validated before use
type ApiSeries = {
	SERIES_CODE: string;
	UNIT?: string;
	VALUES?: {
		SURVEY_DATES?: unknown;
		VALUES?: unknown;
	};
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

// Returns the series values in date order, or throws if the response is not
// a list of numbers or nulls for dates inside the requested period
const parseValues = (
	entry: ApiSeries,
	period: string,
	source: string,
): Map<number, number | null> => {
	const dates = entry.VALUES?.SURVEY_DATES;
	const values = entry.VALUES?.VALUES;
	const fail = (detail: string) => new Error(
		`Unexpected BOJ API values for ${entry.SERIES_CODE} (${detail}): ${source}`,
	);
	if (!Array.isArray(dates) || !Array.isArray(values) || dates.length !== values.length) {
		throw fail('missing or mismatched arrays');
	}
	const pairs: [number, number | null][] = [];
	for (const [index, date] of dates.entries()) {
		// Daily dates are YYYYMMDD within the month; monthly dates equal the period
		if (typeof date !== 'number' || !String(date).startsWith(period)) {
			throw fail(`date ${String(date)} outside ${period}`);
		}
		const value: unknown = values[index];
		if (value !== null && !(typeof value === 'number' && Number.isFinite(value))) {
			throw fail(`value ${JSON.stringify(value)} on ${date}`);
		}
		pairs.push([date, value]);
	}
	if (pairs.length === 0) { throw fail(`no dates for ${period}`); }
	return new Map(pairs.sort(([a], [b]) => a - b));
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
	const body = await response.json().catch(() => {
		// A caller abort while reading the body is cancellation, not a BOJ error
		options?.signal?.throwIfAborted();
		return undefined;
	}) as ApiResponse | undefined;
	if (!response.ok || body?.STATUS !== 200) {
		throw new Error(`BOJ API error (HTTP ${response.status}): ${body?.MESSAGE ?? 'unreadable response'}: ${source}`);
	}
	if (body.MESSAGEID === noDataMessageId) { return null; }

	const series: Record<string, Series> = {};
	for (const entry of body.RESULTSET ?? []) {
		series[entry.SERIES_CODE] = {
			unit: entry.UNIT ?? '',
			values: parseValues(entry, period, source),
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
		throw new RangeError(`Invalid month: ${year}-${String(month).padStart(2, '0')}`);
	}
	const paddedMonth = String(month).padStart(2, '0');
	// Compared as numbers: as strings, year 99 ("99-01") would sort after "1998-01"
	const [earliestYear, earliestMonth] = earliest.split('-').map(Number) as [number, number];
	if (year * 12 + month < earliestYear * 12 + earliestMonth || year > 2099) {
		throw new RangeError(`Month must be between ${earliest} and 2099-12`);
	}
	const formatted = `${year}-${paddedMonth}`;
	return {
		month: formatted,
		period: `${year}${paddedMonth}`,
	};
};
