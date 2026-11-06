import { parseHTML } from 'linkedom';
import {
	parseDate, formatDate, assertDateInRange,
} from '../utils/date.ts';
import type {
	DailyRate, CashRate, DailyResult, FetchOptions,
} from './types.ts';
import {
	formatDateId, parseRate, computeTtm, cleanCellText,
} from './utils.ts';
import { findRatesOnOrBefore } from './business-day.ts';
import { fetchShiftJisHtml, unexpectedPageError } from './fetch-source.ts';
import { getDailyRateUnit } from './rate-units.ts';

const mainColumnsPerRow = 6;
const cashColumnsPerRow = 4;

const parseMainTable = (table: Element, year: number): Record<string, DailyRate> => {
	const cells = Array.from(table.querySelectorAll('td'));
	const rates: Record<string, DailyRate> = {};

	for (let i = 0; i + mainColumnsPerRow <= cells.length; i += mainColumnsPerRow) {
		const name = cleanCellText(cells[i].textContent ?? '');
		const nameJa = cleanCellText(cells[i + 1].textContent ?? '');
		const code = (cells[i + 2].textContent ?? '').trim();
		const tts = parseRate(cells[i + 3].textContent ?? '');
		const ttb = parseRate(cells[i + 4].textContent ?? '');
		const ttm = computeTtm(tts, ttb);

		if (code) {
			rates[code] = {
				name,
				nameJa,
				unit: getDailyRateUnit(code, year),
				tts,
				ttb,
				ttm,
			};
		}
	}

	return rates;
};

const parseCashTable = (table: Element): Record<string, CashRate> => {
	const cells = Array.from(table.querySelectorAll('td'));
	const cashRates: Record<string, CashRate> = {};

	for (let i = 0; i + cashColumnsPerRow <= cells.length; i += cashColumnsPerRow) {
		const code = (cells[i + 1].textContent ?? '').trim();
		const selling = parseRate(cells[i + 2].textContent ?? '');
		const buying = parseRate(cells[i + 3].textContent ?? '');

		if (code && selling !== null && buying !== null) {
			cashRates[code] = {
				selling,
				buying,
			};
		}
	}

	return cashRates;
};

const parseDateFromHeading = (document: Document): string | null => {
	const text = document.documentElement?.textContent ?? '';
	const match = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
	if (!match) { return null; }
	const [, year, month, day] = match;
	return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const earliestDate = '2005-09-01';

const parseDailyPage = (
	url: string,
	html: string,
	tableSelectors: string[],
): DailyResult => {
	const { document } = parseHTML(html);
	const tables = tableSelectors
		.map(selector => document.querySelectorAll(selector))
		.find(found => found.length > 0) ?? [];
	const mainTable = tables[0];
	if (!mainTable) {
		throw unexpectedPageError(url, 'missing rate table');
	}

	const date = parseDateFromHeading(document);
	if (!date) {
		throw unexpectedPageError(url, 'missing date heading');
	}

	const rates = parseMainTable(mainTable, Number(date.slice(0, 4)));
	if (Object.keys(rates).length === 0) {
		throw unexpectedPageError(url, 'empty rate table');
	}

	return {
		source: url,
		date,
		rates,
		cashRates: tables.length >= 2
			? parseCashTable(tables[1])
			: {},
	};
};

const fetchDailyForDate = async (
	date: Date,
	options: FetchOptions,
): Promise<DailyResult | null> => {
	const url = `https://www.murc-kawasesouba.jp/fx/past/index.php?id=${formatDateId(date)}`;
	const html = await fetchShiftJisHtml(url, options);
	if (!html) { return null; }

	const result = parseDailyPage(url, html, ['table.data-table7', 'table.data-table5']);

	// The page ID uses a two-digit year, so verify the page is for the requested date
	const expectedDate = formatDate(date);
	if (result.date !== expectedDate) {
		throw new Error(`Source page is dated ${result.date}, expected ${expectedDate}: ${url}`);
	}

	return result;
};

/**
 * Fetch daily TTS/TTB rates and cash selling/buying rates.
 *
 * If the given date is a weekend or holiday (no published rates), automatically
 * walks back to the nearest preceding business day. This follows the standard
 * practice for Japanese tax filings per NTA guidance (所得税基本通達 57の3-2):
 * https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm
 *
 * The result's `date` field reflects the actual business day used.
 * Call with no date to get today's rates.
 *
 * Throws a RangeError for dates before 2005-09-01 or after today in Japan.
 */
export const fetchDaily = async (
	date?: string | Date,
	options: FetchOptions = {},
): Promise<DailyResult | null> => {
	if (!date) {
		const url = 'https://www.murc-kawasesouba.jp/fx/index.php';
		const html = await fetchShiftJisHtml(url, options);
		if (!html) { return null; }
		return parseDailyPage(url, html, ['table.data-table5']);
	}

	const parsed = parseDate(date);
	assertDateInRange(parsed, earliestDate);
	return findRatesOnOrBefore(parsed, target => fetchDailyForDate(target, options));
};
