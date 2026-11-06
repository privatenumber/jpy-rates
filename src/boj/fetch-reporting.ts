import { parseHTML } from 'linkedom';
import * as XLSX from 'xlsx';
import { fetchSource, type FetchOptions } from '../utils/fetch-source.ts';
import {
	attribution, baseUrl, isUnannounced, japaneseMonth, monthParts,
} from './common.ts';
import type { ReportingRate, ReportingRatesResult } from './types.ts';

const parseHtml = (html: string, month: string): Record<string, ReportingRate> => {
	const { document } = parseHTML(html);
	const contents = document.querySelector('#contents');
	if (japaneseMonth(contents?.querySelector('h1')?.textContent ?? '') !== month) { throw new Error('Unexpected BOJ reporting page month'); }
	const rates: Record<string, ReportingRate> = {};
	for (const element of contents?.querySelectorAll('li') ?? []) {
		const text = (element.textContent ?? '').normalize('NFKC');
		const match = text.match(/\(\s*([\d.]+)\s+([A-Z]{3})\s*\)\s*につき\s*([\d.]+)米ドル/);
		if (match) {
			const [, unit, code, usd] = match;
			rates[code!] = {
				code: code!,
				unit: Number(unit),
				usd: Number(usd),
			};
		}
	}
	return rates;
};

const parseWorkbook = (data: ArrayBuffer, month: string): Record<string, ReportingRate> => {
	const workbook = XLSX.read(data, { type: 'array' });
	const sheet = workbook.Sheets['省令'];
	if (!sheet) { throw new Error('Unexpected BOJ reporting workbook: missing sheet'); }
	const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
		header: 1,
		defval: null,
	});
	if (japaneseMonth(String(rows[0]?.[0] ?? '')) !== month) { throw new Error('Unexpected BOJ reporting workbook month'); }
	const rates: Record<string, ReportingRate> = {};
	for (const row of rows) {
		const label = row.slice(2, 6).join('').normalize('NFKC');
		const match = label.match(/\(\s*([\d.]+)\s+([A-Z]{3})\s*\)/);
		const usd = Number(row[10]);
		if (match && Number.isFinite(usd) && usd > 0) {
			const code = match[2]!;
			rates[code] = {
				code,
				unit: Number(match[1]),
				usd,
			};
		}
	}
	return rates;
};

export const fetchReportingRates = async (
	year: number,
	month: number,
	options?: FetchOptions,
): Promise<ReportingRatesResult | null> => {
	const requested = monthParts(year, month);
	// The archive links ZIP files before March 2017; the equivalent HTML is published alongside them.
	const html = requested.month < '2017-03';
	const source = html
		? `${baseUrl}/syorei/hou${requested.suffix}.htm`
		: `${baseUrl}/syorei/data/hou${requested.suffix}.xlsx`;
	const response = await fetchSource(source, options);
	if (isUnannounced(response, requested.month)) { return null; }
	if (!response.ok) { throw new Error(`HTTP ${response.status}: ${source}`); }
	const rates = html
		? parseHtml(await response.text(), requested.month)
		: parseWorkbook(await response.arrayBuffer(), requested.month);
	if (!rates.JPY || !rates.CAD || !rates.EUR) { throw new Error(`Unexpected BOJ reporting rates: ${source}`); }
	return {
		source,
		attribution,
		month: requested.month,
		rates,
	};
};
