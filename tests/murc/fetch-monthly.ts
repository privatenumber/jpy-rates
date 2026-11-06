import { describe, test, expect } from 'manten';
import { fetchMonthly } from '../../src/murc/fetch-monthly.ts';

describe('fetchMonthly', () => {
	test('fetches Jan 2026 historical data', async () => {
		const result = await fetchMonthly(2026, 1);
		expect(result).not.toBeNull();
		expect(result!.year).toBe(2026);
		expect(result!.month).toBe(1);
		expect(result!.rates.USD).toBeDefined();
		expect(result!.rates.USD.monthEnd.tts).toBeGreaterThan(0);
		expect(result!.rates.USD.monthlyAverage.ttm).toBeGreaterThan(0);
		expect(result!.rates.USD.unit).toBe(1);
	});

	test('KRW and IDR have unit 100', async () => {
		const result = await fetchMonthly(2026, 1);
		expect(result).not.toBeNull();
		expect(result!.rates.KRW.unit).toBe(100);
		expect(result!.rates.IDR.unit).toBe(100);
	});

	test('localMarketRates has entries with selling/buying/source', async () => {
		const result = await fetchMonthly(2026, 1);
		expect(result).not.toBeNull();
		expect(Object.keys(result!.localMarketRates).length).toBeGreaterThan(0);

		const twd = result!.localMarketRates.TWD;
		expect(twd).toBeDefined();
		expect(twd.selling).not.toBeNull();
		expect(twd.buying).not.toBeNull();
		expect(twd.source.length).toBeGreaterThan(0);

		const cny = result!.localMarketRates.CNY;
		expect(cny).toBeDefined();
		expect(cny.source.length).toBeGreaterThan(0);
	});

	test('throws RangeError for months before available data (2004-01)', async () => {
		await expect(fetchMonthly(2004, 1)).rejects.toThrow(RangeError);
	});

	test('rejects a two-digit-year alias of an available month (1926-01)', async () => {
		await expect(fetchMonthly(1926, 1)).rejects.toThrow(RangeError);
	});

	test('throws RangeError for invalid months', async () => {
		await expect(fetchMonthly(2025, 13)).rejects.toThrow('Invalid year and month');
		await expect(fetchMonthly(Number.NaN, 1)).rejects.toThrow('Invalid year and month');
	});

	if (!process.env.JPY_RATES_LIVE) {
		test('parses local market quirks: quote dates, grouped thousands, and merged single rates', async () => {
			const result = await fetchMonthly(2026, 1);
			const {
				TWD, IDR, CNY, HKD,
			} = result!.localMarketRates;
			expect(TWD).toMatchObject({
				selling: 31.5,
				buying: 31.1,
				rate: null,
				quoteDate: '2026-01-24',
			});
			expect(IDR).toMatchObject({
				selling: 16_550,
				buying: 15_950,
				rate: null,
				quoteDate: null,
			});
			// A December quote on the January page belongs to the previous year
			expect(CNY).toMatchObject({
				selling: null,
				buying: null,
				rate: 7.1698,
				quoteDate: '2025-12-31',
			});
			expect(HKD).toMatchObject({
				selling: null,
				buying: null,
				rate: null,
			});
		});
	}

	test('MYR monthEnd and monthlyAverage rates are all null', async () => {
		const result = await fetchMonthly(2026, 1);
		expect(result).not.toBeNull();
		expect(result!.rates.MYR).toBeDefined();
		expect(result!.rates.MYR.monthEnd.tts).toBeNull();
		expect(result!.rates.MYR.monthEnd.ttb).toBeNull();
		expect(result!.rates.MYR.monthEnd.ttm).toBeNull();
		expect(result!.rates.MYR.monthlyAverage.tts).toBeNull();
		expect(result!.rates.MYR.monthlyAverage.ttb).toBeNull();
		expect(result!.rates.MYR.monthlyAverage.ttm).toBeNull();
	});

	test('year and month fields are correct', async () => {
		const result = await fetchMonthly(2026, 1);
		expect(result).not.toBeNull();
		expect(result!.year).toBe(2026);
		expect(result!.month).toBe(1);
	});
});
