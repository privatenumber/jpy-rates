import { fileURLToPath } from 'node:url';
import { formatDate, parseDate } from '../utils/date.ts';
import type { CustomsRate } from './types.ts';

type Item = { str: string;
	x: number;
	y: number; };
type Period = { start: string;
	end: string; };

const eraDate = (
	era: string,
	year: string,
	western: string | undefined,
	month: string,
	day: string,
): string => {
	const number = year === '元' ? 1 : Number(year);
	if (number < 1) { throw new Error(`Invalid Japanese era year: ${era}${year}年`); }
	const westernYear = (era === '令和' ? 2018 : 1988) + number;
	if (western && Number(western) !== westernYear) {
		throw new Error(`Japanese era year does not match Western year: ${era}${year}年(${western}年)`);
	}
	const value = `${westernYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	const date = formatDate(parseDate(value));
	if (!western && ((era === '令和' && date < '2019-05-01') || (era === '平成' && (date < '1989-01-08' || date > '2019-04-30')))) {
		throw new Error(`Invalid Japanese era date: ${era}${year}年${month}月${day}日`);
	}
	return date;
};

export const parseCustomsText = (
	pages: Item[][],
	expected: Period,
): Record<string, CustomsRate> => {
	const periodText = pages.flat().map(item => item.str).join('').normalize('NFKC');
	const period = periodText.match(/適用期間\s*[:：]\s*(平成|令和)(元|\d+)年(?:\((\d{4})年\))?(\d+)月(\d+)日から(平成|令和)(元|\d+)年(?:\((\d{4})年\))?(\d+)月(\d+)日まで/);
	if (!period) { throw new Error('Customs PDF has no recognizable application period'); }
	const start = eraDate(period[1]!, period[2]!, period[3], period[4]!, period[5]!);
	const end = eraDate(period[6]!, period[7]!, period[8], period[9]!, period[10]!);
	if (start !== expected.start || end !== expected.end) { throw new Error(`Customs PDF period ${start} to ${end} does not match index ${expected.start} to ${expected.end}`); }
	const rates: Record<string, CustomsRate> = {};
	const equivalents: { code: string;
		name: string; }[] = [];
	for (const items of pages) {
		const codes = items.filter(item => /^[A-Z]{3}$/.test(item.str) && item.str !== 'ISO');
		// EUR has no country number in the published table; its country label is its row marker.
		const markers = items.filter(item => (item.x < 100 && /^\d{3}他?$/.test(item.str.trim()))
			|| item.str.trim() === '欧州統一通貨');
		if (markers.length !== codes.length
			|| markers.some(marker => (
				codes.filter(code => Math.abs(code.y - marker.y) < 3).length !== 1
			))) {
			throw new Error(`Customs PDF row markers (${markers.length}) do not match currency codes (${codes.length})`);
		}
		for (const codeItem of codes) {
			const row = items.filter(item => Math.abs(item.y - codeItem.y) < 3 && item.str.trim())
				.sort((a, b) => a.x - b.x);
			const country = row.filter(item => item.x > codeItem.x - 275 && item.x < codeItem.x - 100).map(item => item.str.trim()).join('');
			const currencyJa = row.filter(item => item.x >= codeItem.x - 100 && item.x < codeItem.x - 10).map(item => item.str.trim()).join('');
			const values = row.filter(item => item.x > codeItem.x + 20).map(item => item.str.trim());
			if (!country || !currencyJa || values.length !== 1 || Object.hasOwn(rates, codeItem.str)) {
				throw new Error(`Unexpected Customs PDF row for ${codeItem.str}: ${JSON.stringify(row)}`);
			}
			const value = values[0]!;
			const valueItem = row.find(item => item.str.trim() === value)!;
			const equivalent = value.match(/^(.+)と等価$/);
			if (!equivalent && !/^\d+(?:\.\d+)?$/.test(value)) { throw new Error(`Unexpected Customs rate for ${codeItem.str}: ${value}`); }
			rates[codeItem.str] = {
				code: codeItem.str,
				countries: [country],
				currencyJa,
				unit: valueItem.x > codeItem.x + 120 ? 100 : 1,
				rate: equivalent ? 0 : Number(value),
				equivalentTo: null,
			};
			if (equivalent) {
				equivalents.push({
					code: codeItem.str,
					name: equivalent[1]!,
				});
			}
		}
	}
	if (Object.keys(rates).length === 0) { throw new Error('Customs PDF contains no rates'); }
	for (const equivalent of equivalents) {
		const matches = Object.values(rates).filter(rate => `${rate.countries[0]}・${rate.currencyJa}` === equivalent.name);
		if (matches.length !== 1 || equivalents.some(entry => entry.code === matches[0]!.code)) { throw new Error(`Cannot resolve equivalent currency: ${equivalent.name}`); }
		const target = matches[0]!;
		Object.assign(rates[equivalent.code]!, {
			unit: target.unit,
			rate: target.rate,
			equivalentTo: target.code,
		});
	}
	return rates;
};

export const parseCustomsPdf = async (
	data: Uint8Array,
	period: Period,
): Promise<Record<string, CustomsRate>> => {
	const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
	const packageUrl = import.meta.resolve('pdfjs-dist/package.json');
	const task = getDocument({
		data,
		cMapUrl: fileURLToPath(new URL('cmaps/', packageUrl)),
		cMapPacked: true,
		standardFontDataUrl: fileURLToPath(new URL('standard_fonts/', packageUrl)),
	});
	try {
		const document = await task.promise;
		const pages: Item[][] = [];
		for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
			const page = await document.getPage(pageNumber);
			const content = await page.getTextContent();
			pages.push(content.items.flatMap(item => ('str' in item
				? [{
					str: item.str,
					x: item.transform[4]!,
					y: item.transform[5]!,
				}]
				: [])));
		}
		return parseCustomsText(pages, period);
	} finally {
		await task.destroy();
	}
};
