import { describe, expect, test } from 'manten';
import { fetchBasicRates, fetchReportingRates } from '../../src/boj/index.ts';

if (!process.env.JPY_RATES_LIVE) {
	describe('BOJ rates', () => {
		test('parses basic, cross and reference units', async () => {
			const result = await fetchBasicRates(2026, 11);
			expect(result!.basic).toBe(140);
			expect(result!.cross.EUR).toBe(105);
			expect(result!.referenceMonth).toBe('2026-09');
			expect(result!.reference[0]).toStrictEqual({
				code: 'KRW',
				nameJa: '韓国ウォン',
				unit: 100,
				usd: 0.08,
			});
			expect(result!.arbitrated.KRW).toStrictEqual({
				unit: 100,
				rate: 11.2,
			});
			expect(result!.reference[3]).toStrictEqual({
				code: null,
				nameJa: '未知通貨',
				unit: 1,
				usd: 0.5,
			});
			expect(Object.keys(result!.arbitrated)).toStrictEqual(['KRW', 'AUD', 'VES']);
		});
		test('maps Venezuela code by publication month and accepts name variations', async () => {
			const before = await fetchBasicRates(2018, 9);
			const transition = await fetchBasicRates(2018, 10);
			const after = await fetchBasicRates(2018, 11);
			expect(before!.reference[2]!.code).toBe('VEB');
			expect(transition!.reference[2]!.code).toBe('VES');
			expect(after!.reference[2]!.code).toBe('VES');
			expect(before!.arbitrated.VEB).toStrictEqual({
				unit: 1,
				rate: 28,
			});
		});
		test('parses USD reporting quotes including JPY', async () => {
			const result = await fetchReportingRates(2026, 11);
			expect(result!.rates.JPY).toStrictEqual({
				code: 'JPY',
				unit: 140,
				usd: 1,
			});
			expect(result!.rates.KRW).toStrictEqual({
				code: 'KRW',
				unit: 100,
				usd: 0.08,
			});
		});
		test('parses older reporting HTML', async () => {
			const result = await fetchReportingRates(2016, 1);
			expect(result!.rates.KRW).toStrictEqual({
				code: 'KRW',
				unit: 100,
				usd: 0.08,
			});
		});
		test('keeps currencies published without a rate', async () => {
			const basic = await fetchBasicRates(2021, 5);
			expect(basic!.reference.find(row => row.code === 'MMK')).toStrictEqual({
				code: 'MMK',
				nameJa: 'ミャンマー・チャット',
				unit: 1,
				usd: null,
			});
			expect(basic!.arbitrated.MMK).toBeUndefined();

			const reporting = await fetchReportingRates(2021, 5);
			expect(reporting!.rates.MMK).toStrictEqual({
				code: 'MMK',
				unit: 1,
				usd: null,
			});
		});

		test('parses reporting HTML without a space between units and code', async () => {
			const result = await fetchReportingRates(2016, 4);
			expect(result!.rates.JPY).toStrictEqual({
				code: 'JPY',
				unit: 115,
				usd: 1,
			});
			expect(result!.rates.CAD!.usd).toBe(0.725);
			expect(result!.rates.MMK!.usd).toBeNull();
		});

		test('rejects malformed numbers instead of returning NaN', async () => {
			await expect(fetchBasicRates(2021, 4)).rejects.toThrow('Unexpected BOJ market rate "100韓国ウォンにつき0..0800米ドル"');
			await expect(fetchReportingRates(2016, 5)).rejects.toThrow('Unexpected BOJ reporting rate');
		});

		test('rejects malformed published pages', async () => {
			await expect(fetchBasicRates(2026, 10)).rejects.toThrow('Unexpected BOJ');
		});
		test('validates months and reports unannounced publications', async () => {
			for (const fetchRates of [fetchBasicRates, fetchReportingRates]) {
				await expect(fetchRates(2015, 12)).rejects.toThrow(RangeError);
				await expect(fetchRates(2026, 0)).rejects.toThrow(RangeError);
				await expect(fetchRates(2026.5, 1)).rejects.toThrow(RangeError);
				expect(await fetchRates(2099, 12)).toBeNull();
				await expect(fetchRates(2016, 2)).rejects.toThrow('HTTP 404');
			}
		});
	});
}
