import { parseHTML } from 'linkedom';
import { rateSources } from '../guide/sources.ts';
import { formatDate, parseDate } from '../utils/date.ts';
import { fetchSource, type FetchOptions } from '../utils/fetch-source.ts';
import { parseCustomsPdf } from './parse-pdf.ts';
import type { CustomsRatesResult } from './types.ts';

const indexUrl = 'https://www.customs.go.jp/tetsuzuki/kawase/index.htm';

export const fetchCustomsRates = async (
	date: string | Date,
	options?: FetchOptions,
): Promise<CustomsRatesResult | null> => {
	const requested = formatDate(parseDate(date));
	const response = await fetchSource(indexUrl, options);
	if (!response.ok) { throw new Error(`Customs index returned HTTP ${response.status}`); }
	const html = new TextDecoder('shift_jis').decode(await response.arrayBuffer());
	const { document } = parseHTML(html);
	const weeks = Array.from(document.querySelectorAll('a[href]')).flatMap((anchor) => {
		const href = anchor.getAttribute('href')!;
		const match = href.match(/kouji-rate(\d{8})-(\d{4}|\d{6}|\d{8})\.pdf$/i);
		if (!match) {
			if (/kouji-rate.*\.pdf$/i.test(href)) { throw new Error(`Unrecognized Customs PDF link: ${href}`); }
			return [];
		}
		const start = `${match[1]!.slice(0, 4)}-${match[1]!.slice(4, 6)}-${match[1]!.slice(6, 8)}`;
		const prefixLength = 8 - match[2]!.length;
		const endDigits = `${match[1]!.slice(0, prefixLength)}${match[2]}`;
		const end = `${endDigits.slice(0, 4)}-${endDigits.slice(4, 6)}-${endDigits.slice(6, 8)}`;
		parseDate(start);
		parseDate(end);
		if (end < start) { throw new Error(`Invalid Customs PDF period: ${href}`); }
		return [{
			start,
			end,
			url: new URL(href, indexUrl).href,
		}];
	});
	if (weeks.length === 0) { throw new Error('Unexpected Customs index structure: no weekly PDF links'); }
	const earliest = weeks.map(week => week.start).sort()[0]!;
	if (requested < earliest) { throw new RangeError(`Date ${requested} is before the earliest available date ${earliest}`); }
	const matches = weeks.filter(week => week.start <= requested && requested <= week.end);
	if (matches.length > 1) { throw new Error(`Multiple Customs periods cover ${requested}`); }
	const week = matches[0];
	if (!week) { return null; }
	const pdf = await fetchSource(week.url, options);
	if (!pdf.ok) { throw new Error(`Customs PDF returned HTTP ${pdf.status}: ${week.url}`); }
	const rates = await parseCustomsPdf(new Uint8Array(await pdf.arrayBuffer()), week);
	return {
		source: week.url,
		attribution: rateSources.find(source => source.id === 'customs')!.attribution,
		period: {
			start: week.start,
			end: week.end,
		},
		rates,
	};
};
