import { fetchSource } from '../utils/fetch-source.ts';
import { fetchShiftJisHtml } from './fetch-source.ts';
import type { FetchOptions, WorldRate, WorldResult } from './types.ts';

const baseUrl = 'https://www.murc-kawasesouba.jp/fx/worlddata/';

const regionFiles = ['asia', 'africa', 'europe', 'mideast', 'america'] as const;

// RFC 4180: quoted fields may contain commas, newlines, and "" escapes
const parseCsvRecords = (text: string): string[][] => {
	const records: string[][] = [];
	let fields: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let index = 0; index < text.length; index += 1) {
		const character = text[index];
		if (inQuotes) {
			if (character !== '"') {
				current += character;
			} else if (text[index + 1] === '"') {
				current += '"';
				index += 1;
			} else {
				inQuotes = false;
			}
		} else {
			switch (character) {
				case '"': {
					inQuotes = true;

					break;
				}
				case ',': {
					fields.push(current.trim());
					current = '';

					break;
				}
				case '\n': {
					fields.push(current.trim());
					records.push(fields);
					fields = [];
					current = '';

					break;
				}
				case '\r': {
					break;
				}
				default: {
					current += character;
				}
			}
		}
	}

	fields.push(current.trim());
	records.push(fields);
	return records.filter(record => record.some(field => field.length > 0));
};

// The first column is spelled "countory" or "country" depending on the region
const headerColumns = ['japanese', 'currencyunit', 'codeaddress', 'quotations', 'rateofexchange', 'remarks'];

export const parseCsv = (text: string, filename: string): WorldRate[] => {
	const records = parseCsvRecords(text);
	const header = records[0]?.map(field => field.trim().toLowerCase()) ?? [];
	// A maintenance page served with HTTP 200 would otherwise parse as an empty region
	if (headerColumns.some((column, index) => header[index + 1] !== column) || records.length < 2) {
		throw new Error(`Unexpected world rates CSV (${filename}.csv): header ${JSON.stringify(records[0]?.slice(0, 7) ?? [])}, ${records.length} records`);
	}

	// Skip header row
	// The CSVs contain HTML <br> tags and &yen; entities from the source page.
	// Strip them since this is a programmatic API, not an HTML renderer.
	const cleanHtml = (html: string) => html
		.replaceAll('<br>', ' ')
		.replaceAll(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replaceAll('&yen;', '¥')
		.replaceAll('&reg;', '')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&amp;', '&') // must be last (other entities contain &)
		.trim();

	return records.slice(1).map(fields => ({
		country: cleanHtml(fields[0] ?? ''),
		countryJa: cleanHtml(fields[1] ?? ''),
		currency: cleanHtml(fields[2] ?? ''),
		code: cleanHtml(fields[3] ?? ''),
		quotation: cleanHtml(fields[4] ?? ''),
		marketLevel: cleanHtml(fields[5] ?? ''),
		remarks: cleanHtml(fields[6] ?? ''),
	}));
};

const fetchCsv = async (filename: string, options: FetchOptions): Promise<WorldRate[]> => {
	const response = await fetchSource(`${baseUrl}${filename}.csv`, options);
	if (response.status < 200 || response.status >= 300) {
		throw new Error(`Failed to fetch ${filename}.csv (HTTP ${response.status})`);
	}
	const buffer = await response.arrayBuffer();
	const text = new TextDecoder('shift_jis').decode(buffer);
	return parseCsv(text, filename);
};

const parseDateFromText = (text: string): string => {
	// The page has multiple dates (old maintenance notices, commented-out SDR notes).
	// The actual data date is followed by '現在' ("as of").
	const match = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日[）)\s]*現在/);
	if (!match) {
		// Fallback: last date on the page (most likely the data date)
		const allDates = [...text.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日/g)];
		const last = allDates.at(-1);
		if (!last) {
			throw new Error('Could not extract date from world page');
		}
		const [, year, month, day] = last;
		return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	}
	const [, year, month, day] = match;
	return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const fetchWorld = async (options: FetchOptions = {}): Promise<WorldResult> => {
	const html = await fetchShiftJisHtml('https://www.murc-kawasesouba.jp/fx/world.html', options);
	if (!html) {
		throw new Error('Failed to fetch world page');
	}

	const date = parseDateFromText(html);

	const [asia, africa, europe, mideast, americas] = await Promise.all(
		regionFiles.map(region => fetchCsv(region, options)),
	);

	return {
		source: 'https://www.murc-kawasesouba.jp/fx/world.html',
		date,
		asia,
		africa,
		europe,
		mideast,
		americas,
	};
};
