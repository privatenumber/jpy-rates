import { rateSources } from '../guide/sources.ts';
import { formatDate, getTodayInJapan } from '../utils/date.ts';

export const { attribution } = (rateSources.find(source => source.id === 'boj')!);
export const baseUrl = 'https://www.boj.or.jp/about/services/tame/tame_rate';

export const isUnannounced = (response: Response, month: string): boolean => (
	response.status === 404 && month > formatDate(getTodayInJapan()).slice(0, 7)
);

export const monthParts = (year: number, month: number) => {
	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		throw new RangeError(`Invalid month: ${year}-${month}`);
	}
	if (year < 2016 || year > 2099) {
		throw new RangeError('Month must be between 2016-01 and 2099-12');
	}
	const paddedMonth = String(month).padStart(2, '0');
	return {
		month: `${year}-${paddedMonth}`,
		suffix: `${String(year).slice(-2)}${paddedMonth}`,
	};
};

export const japaneseMonth = (text: string): string | undefined => {
	const match = text.normalize('NFKC').match(/(令和|平成)(元|\d+)年\s*(\d+)月/);
	if (!match) { return undefined; }
	const year = (match[1] === '令和' ? 2018 : 1988) + (match[2] === '元' ? 1 : Number(match[2]));
	return `${year}-${match[3]!.padStart(2, '0')}`;
};
