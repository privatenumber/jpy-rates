import { parseHTML } from 'linkedom';
import {
	parseDate, formatDate, assertDateInRange,
} from '../utils/date.ts';
import type { FetchOptions, Rate, RatesResult } from './types.ts';
import {
	parseRate, cleanCellText,
} from './utils.ts';
import { findRatesOnOrBefore } from './business-day.ts';
import { fetchShiftJisHtml, unexpectedPageError } from './fetch-source.ts';
import { getDailyRateUnit, normalizeDailyRateCode } from './rate-units.ts';

const columnsPerRow = 6;
const earliestDate = '1990-01-01';

const fetchRatesForDate = async (
	date: Date,
	options: FetchOptions,
): Promise<RatesResult | null> => {
	const year = date.getUTCFullYear();
	const month = date.getUTCMonth() + 1;
	const day = date.getUTCDate();

	const url = `https://www.murc-kawasesouba.jp/fx/past_3month_result.php?y=${year}&m=${month}&d=${day}`;
	const html = await fetchShiftJisHtml(url, options);
	if (!html) { return null; }

	const { document } = parseHTML(html);
	const table = document.querySelector('table.data-table5');
	if (!table) {
		throw unexpectedPageError(url, 'missing rate table');
	}

	// The HTML is malformed — most <tr> opening tags are missing,
	// so linkedom doesn't group <td> elements into rows.
	// Instead, select all <td> elements and group them manually.
	const cells = Array.from(table.querySelectorAll('td'));

	// A shifted or added column would otherwise be read silently as other rates
	if (cells.length % columnsPerRow !== 0) {
		throw unexpectedPageError(url, `${cells.length} cells are not rows of ${columnsPerRow}`);
	}

	const rates: Record<string, Rate> = {};

	for (let i = 0; i + columnsPerRow <= cells.length; i += columnsPerRow) {
		const name = cleanCellText(cells[i].textContent ?? '');
		const nameJa = cleanCellText(cells[i + 1].textContent ?? '');
		const rawCode = (cells[i + 2].textContent ?? '').trim();
		const code = normalizeDailyRateCode(rawCode, name, nameJa);
		const tts = parseRate(cells[i + 3].textContent ?? '');
		const ttb = parseRate(cells[i + 4].textContent ?? '');
		const ttm = parseRate(cells[i + 5].textContent ?? '');

		// MURC defines TTM as (TTS + TTB) / 2; a mismatch means the columns are misread
		const hasAllRates = tts !== null && ttb !== null && ttm !== null;
		const midpointGap = hasAllRates ? Math.abs(ttm - ((tts + ttb) / 2)) : 0;
		if (midpointGap > 0.0051) {
			throw unexpectedPageError(url, `${rawCode} TTM ${ttm} is not the midpoint of TTS ${tts} and TTB ${ttb}`);
		}

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

	if (Object.keys(rates).length === 0) {
		throw unexpectedPageError(url, 'empty rate table');
	}

	return {
		source: url,
		date: formatDate(date),
		rates,
	};
};

/**
 * Fetch daily TTS/TTB/TTM rates for all currencies.
 *
 * If the given date is a weekend or holiday (no published rates), automatically
 * walks back to the nearest preceding business day. This follows the standard
 * practice for Japanese tax filings per NTA guidance (所得税基本通達 57の3-2):
 * https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm
 *
 * The result's `date` field reflects the actual business day used, which may
 * differ from the requested date.
 *
 * Throws a RangeError for dates before 1990-01-01 or after today in Japan.
 */
export const fetchRates = async (
	date: string | Date,
	options: FetchOptions = {},
): Promise<RatesResult | null> => {
	const parsed = parseDate(date);
	assertDateInRange(parsed, earliestDate);
	return findRatesOnOrBefore(parsed, target => fetchRatesForDate(target, options));
};
