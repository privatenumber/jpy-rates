import { parseHTML } from 'linkedom';
import { fetchSource, type FetchOptions } from '../utils/fetch-source.ts';
import {
	attribution, baseUrl, isUnannounced, japaneseMonth, monthParts,
} from './common.ts';
import { currencyNames } from './currency-names.ts';
import type { BasicRatesResult } from './types.ts';

const crossNames: Record<string, string> = {
	カナダ・ドル: 'CAD',
	中国元: 'CNY',
	スウェーデン・クローネ: 'SEK',
	スイス・フラン: 'CHF',
	スターリング・ポンド: 'GBP',
	ユーロ: 'EUR',
};

export const fetchBasicRates = async (
	year: number,
	month: number,
	options?: FetchOptions,
): Promise<BasicRatesResult | null> => {
	const requested = monthParts(year, month);
	const source = `${baseUrl}/kijun/kiju${requested.suffix}.htm`;
	const response = await fetchSource(source, options);
	if (isUnannounced(response, requested.month)) { return null; }
	if (!response.ok) { throw new Error(`HTTP ${response.status}: ${source}`); }
	const { document } = parseHTML(await response.text());
	const contents = document.querySelector('#contents');
	const title = contents?.querySelector('h1')?.textContent ?? '';
	const basicText = Array.from(contents?.querySelectorAll('p') ?? []).map(element => element.textContent ?? '').find(text => text.includes('1米ドルにつき本邦通貨'));
	const basic = Number(basicText?.normalize('NFKC').match(/1米ドルにつき本邦通貨\s*[:：]\s*([\d.]+)円/)?.[1]);
	const referenceHeading = Array.from(contents?.querySelectorAll('h4') ?? []).find(element => element.textContent?.includes('市場実勢相場'));
	const referenceMonth = japaneseMonth(referenceHeading?.textContent ?? '');
	const cross: Record<string, number> = {};
	for (const row of contents?.querySelectorAll('tr') ?? []) {
		const text = (row.textContent ?? '').normalize('NFKC').replaceAll(/\s/g, '');
		const match = text.match(/\(1(.+?)につき本邦通貨\)([\d.]+)円/);
		if (match && crossNames[match[1]!]) { cross[crossNames[match[1]!]!] = Number(match[2]); }
	}
	const reference: BasicRatesResult['reference'] = [];
	for (const element of contents?.querySelectorAll('li') ?? []) {
		const text = (element.textContent ?? '').normalize('NFKC').replaceAll(/\s/g, '');
		const match = text.match(/^(\d+)(\D+?)につき([\d.]+)米ドル$/);
		if (match) {
			const nameJa = match[2]!;
			// BOJ reporting labels use VEB through 2018-09 and VES from 2018-10.
			const code = nameJa.startsWith('ベネズエラ')
				? (requested.month < '2018-10' ? 'VEB' : 'VES')
				: currencyNames[nameJa] ?? null;
			reference.push({
				code,
				nameJa,
				unit: Number(match[1]),
				usd: Number(match[3]),
			});
		}
	}
	if (japaneseMonth(title) !== requested.month || !basic || !referenceMonth
		|| Object.keys(cross).length !== 6 || !reference.length) {
		throw new Error(`Unexpected BOJ basic rates page: ${source}`);
	}
	return {
		source,
		attribution,
		month: requested.month,
		basic,
		cross,
		referenceMonth,
		reference,
		arbitrated: Object.fromEntries(reference.filter(row => row.code !== null).map(row => [
			row.code!, {
				unit: row.unit,
				rate: Number((row.usd * basic).toPrecision(12)),
			},
		])),
	};
};
