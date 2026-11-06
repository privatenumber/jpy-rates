import { describe, test, expect } from 'manten';
import { convertCurrency, convertWithRates } from '../../src/murc/convert-currency.ts';
import { fetchRates } from '../../src/murc/fetch-rates.ts';
import type { ConversionPurpose } from '../../src/murc/types.ts';

describe('convertCurrency', () => {
	test('converts foreign currency to JPY with TTM by default', async () => {
		const rates = await fetchRates('2025-01-06');
		const result = await convertCurrency({
			amount: 100,
			from: 'USD',
			to: 'JPY',
			date: '2025-01-06',
		});

		expect(result).not.toBeNull();
		expect(result!.convertedAmount).toBeCloseTo(100 * rates!.rates.USD.ttm!, 8);
		expect(result!.rate).toBe('ttm');
		expect(result!.rateValue).toBe(rates!.rates.USD.ttm);
		expect(result!.unit).toBe(1);
		expect(result!.sourceDate).toBe('2025-01-06');
	});

	test('converts JPY to foreign currency', async () => {
		const rates = await fetchRates('2025-01-06');
		const result = await convertCurrency({
			amount: 10_000,
			from: 'JPY',
			to: 'USD',
			date: '2025-01-06',
		});

		expect(result).not.toBeNull();
		expect(result!.convertedAmount).toBeCloseTo(10_000 / rates!.rates.USD.ttm!, 8);
		expect(result!.from).toBe('JPY');
		expect(result!.to).toBe('USD');
	});

	test('uses selected rate type', async () => {
		const rates = await fetchRates('2025-01-06');
		const result = await convertCurrency({
			amount: 100,
			from: 'USD',
			to: 'JPY',
			date: '2025-01-06',
			rate: 'tts',
		});

		expect(result).not.toBeNull();
		expect(result!.convertedAmount).toBeCloseTo(100 * rates!.rates.USD.tts!, 8);
		expect(result!.rate).toBe('tts');
		expect(result!.rateValue).toBe(rates!.rates.USD.tts);
	});

	test('applies per-100 quote units', async () => {
		const rates = await fetchRates('2025-01-06');
		const result = await convertCurrency({
			amount: 10_000,
			from: 'KRW',
			to: 'JPY',
			date: '2025-01-06',
		});

		expect(result).not.toBeNull();
		expect(result!.convertedAmount).toBeCloseTo((10_000 * rates!.rates.KRW.ttm!) / 100, 8);
		expect(result!.unit).toBe(100);
	});

	test('converts legacy Belgian Franc commercial rows per 100 units', async () => {
		// Asserts synthetic fixture values
		if (process.env.JPY_RATES_LIVE) { return; }
		const result = await convertCurrency({
			amount: 1000,
			from: 'BEF',
			to: 'JPY',
			date: '1994-01-05',
		});

		expect(result).not.toBeNull();
		expect(result!.convertedAmount).toBe(3100);
		expect(result!.unit).toBe(100);
	});

	test('reports requested and source dates when walking back', async () => {
		const result = await convertCurrency({
			amount: 100,
			from: 'USD',
			to: 'JPY',
			date: '2025-01-04',
		});

		expect(result).not.toBeNull();
		expect(result!.requestedDate).toBe('2025-01-04');
		expect(result!.sourceDate).toBe('2024-12-30');
	});

	test('normalizes currency codes', async () => {
		const result = await convertCurrency({
			amount: 100,
			from: 'usd',
			to: 'jpy',
			date: '2025-01-06',
		});

		expect(result).not.toBeNull();
		expect(result!.from).toBe('USD');
		expect(result!.to).toBe('JPY');
	});

	test('throws for unquoted currency rates', async () => {
		await expect(async () => convertCurrency({
			amount: 100,
			from: 'MYR',
			to: 'JPY',
			date: '2025-01-06',
		})).rejects.toThrow('Currency MYR has no TTM rate');
	});

	test('throws for foreign-to-foreign conversion', async () => {
		await expect(async () => convertCurrency({
			amount: 100,
			from: 'USD',
			to: 'EUR',
			date: '2025-01-06',
		})).rejects.toThrow('only supports JPY and one foreign currency');
	});

	test('convertWithRates reuses an already-fetched quote', () => {
		const rates = {
			source: 'https://example.com',
			date: '2025-01-06',
			rates: {
				KRW: {
					name: 'Won',
					nameJa: 'Won',
					unit: 100,
					tts: 11,
					ttb: 10,
					ttm: 10.5,
				},
			},
		};
		expect(convertWithRates(rates, {
			amount: 1000,
			from: 'krw',
			to: 'JPY',
		})).toStrictEqual({
			source: 'https://example.com',
			sourceDate: '2025-01-06',
			amount: 1000,
			from: 'KRW',
			to: 'JPY',
			rate: 'ttm',
			purpose: null,
			rateValue: 10.5,
			unit: 100,
			convertedAmount: 105,
		});
	});

	test('rejects non-positive rates instead of returning Infinity', () => {
		const rates = {
			source: 'https://example.com',
			date: '2025-01-06',
			rates: {
				USD: {
					name: 'US Dollar',
					nameJa: 'US Dollar',
					unit: 1,
					tts: 0,
					ttb: 0,
					ttm: 0,
				},
			},
		};
		expect(() => convertWithRates(rates, {
			amount: 100,
			from: 'JPY',
			to: 'USD',
		})).toThrow('invalid TTM rate');
	});

	test('purpose selects the rate type that tax rules specify', () => {
		const rates = {
			source: 'https://example.com',
			date: '2025-01-06',
			rates: {
				USD: {
					name: 'US Dollar',
					nameJa: 'US Dollar',
					unit: 1,
					tts: 105,
					ttb: 103,
					ttm: 104,
				},
			},
		};
		const convert = (purpose: ConversionPurpose) => convertWithRates(rates, {
			amount: 10,
			from: 'USD',
			to: 'JPY',
			purpose,
		});
		expect(convert('stock-sale')).toMatchObject({
			rate: 'ttb',
			purpose: 'stock-sale',
			convertedAmount: 1030,
		});
		expect(convert('stock-acquisition').rate).toBe('tts');
		expect(convert('dividend').rate).toBe('ttb');
		expect(convert('inheritance-asset').rate).toBe('ttb');
		expect(convert('inheritance-debt').rate).toBe('tts');
		expect(convert('foreign-asset-report').rate).toBe('ttb');
		expect(convert('general').rate).toBe('ttm');
	});

	test('rejects combining rate and purpose, and unknown purposes', () => {
		const rates = {
			source: 'https://example.com',
			date: '2025-01-06',
			rates: {},
		};
		expect(() => convertWithRates(rates, {
			amount: 1,
			from: 'USD',
			to: 'JPY',
			rate: 'ttm',
			purpose: 'stock-sale',
		})).toThrow('either rate or purpose');
		expect(() => convertWithRates(rates, {
			amount: 1,
			from: 'USD',
			to: 'JPY',
			purpose: 'toString' as ConversionPurpose,
		})).toThrow('Invalid purpose');
	});

	test('converted amounts have no floating-point noise', () => {
		const result = convertWithRates({
			source: 'https://example.com',
			date: '2025-01-06',
			rates: {
				USD: {
					name: 'US Dollar',
					nameJa: 'US Dollar',
					unit: 1,
					tts: 158.73,
					ttb: 156.73,
					ttm: 157.73,
				},
			},
		}, {
			amount: 100,
			from: 'USD',
			to: 'JPY',
		});
		// 100 * 157.73 is 15772.999999999998 in binary floating point
		expect(result.convertedAmount).toBe(15_773);
	});
});
