import { describe, expect, test } from 'manten';
import spawn from 'nano-spawn';
import {
	fetchDailyMarketRates, fetchEffectiveRates, fetchMonthlyMarketRates,
} from '../../src/boj/index.ts';

const credit = 'このサービスは、日本銀行時系列統計データ検索サイトの API 機能を使用しています。サービスの内容は日本銀行によって保証されたものではありません。';

if (process.env.JPY_RATES_LIVE) {
	describe('BOJ time-series API (live)', () => {
		test('daily, monthly, and effective rates for a past month', async () => {
			const daily = await fetchDailyMarketRates(2024, 1);
			expect(daily!.days.length).toBeGreaterThan(15);
			for (const day of daily!.days) {
				expect(day.date.startsWith('2024-01-')).toBe(true);
				expect(day.center).toBeGreaterThan(100);
				expect(day.high!).toBeGreaterThanOrEqual(day.low!);
			}

			const monthly = await fetchMonthlyMarketRates(2024, 1);
			expect(monthly!.average.center).toBeGreaterThan(100);
			expect(monthly!.high!).toBeGreaterThanOrEqual(monthly!.low!);

			const effective = await fetchEffectiveRates(2024, 1);
			expect(effective!.base).toMatch(/=100/);
			expect(effective!.nominal).toBeGreaterThan(0);
			expect(effective!.real).toBeGreaterThan(0);
		});
	});
} else {
	describe('BOJ time-series API', () => {
		test('daily rates list trading days only', async () => {
			const result = await fetchDailyMarketRates(2026, 10);
			expect(result!.attribution).toBe(credit);
			expect(result!.source).toContain('db=FM08');
			expect(result!.days).toStrictEqual([
				{
					date: '2026-10-01',
					at0900: 101,
					at1700: 104,
					center: 105,
					high: 102,
					low: 103,
				},
				{
					date: '2026-10-02',
					at0900: 101.1,
					at1700: 104.1,
					center: 105.1,
					high: 102.1,
					low: 103.1,
				},
			]);
		});

		test('unpublished periods return null', async () => {
			expect(await fetchDailyMarketRates(2026, 12)).toBeNull();
			expect(await fetchMonthlyMarketRates(2026, 11)).toBeNull();
		});

		test('monthly summary maps each series', async () => {
			const result = await fetchMonthlyMarketRates(2026, 10);
			expect(result).toMatchObject({
				month: '2026-10',
				average: {
					at1700: 117,
					center: 119,
				},
				end: {
					at1700: 116,
					center: 118,
				},
				high: 113,
				low: 115,
			});
		});

		test('months before the central rate keep the 17:00 series', async () => {
			const result = await fetchMonthlyMarketRates(1980, 1);
			expect(result).toMatchObject({
				average: {
					at1700: 200,
					center: null,
				},
				end: {
					at1700: 200,
					center: null,
				},
				high: null,
			});
		});

		test('effective indices include the published base', async () => {
			expect(await fetchEffectiveRates(2026, 9)).toMatchObject({
				month: '2026-09',
				base: 'CY 2020=100',
				nominal: 70,
				real: 65,
			});
		});

		test('API errors include the BOJ message', async () => {
			await expect(fetchEffectiveRates(1970, 1)).rejects.toThrow('Nonexistent series code');
		});

		test('rejects malformed values instead of returning them', async () => {
			await expect(fetchEffectiveRates(2026, 1)).rejects.toThrow('value "70.1"');
			await expect(fetchEffectiveRates(2026, 2)).rejects.toThrow('missing or mismatched arrays');
			await expect(fetchEffectiveRates(2026, 3)).rejects.toThrow('date 202602 outside 202603');
		});

		test('daily rates are in date order', async () => {
			const result = await fetchDailyMarketRates(2026, 9);
			expect(result!.days.map(day => day.date)).toStrictEqual(['2026-09-01', '2026-09-02']);
		});

		test('rejects months outside each series', async () => {
			await expect(fetchDailyMarketRates(1997, 12)).rejects.toThrow('Month must be between 1998-01 and 2099-12');
			await expect(fetchMonthlyMarketRates(2026, 13)).rejects.toThrow('Invalid month: 2026-13');
			await expect(fetchMonthlyMarketRates(2026, 0)).rejects.toThrow('Invalid month: 2026-00');
		});

		const run = async (...args: string[]) => {
			const result = await spawn(process.execPath, ['--import', './tests/helpers/register-fixture-fetch.ts', 'src/cli/index.ts', 'boj', ...args]);
			return result.stdout;
		};

		test('market CLI: date, month, --daily, and credit text', async () => {
			const day = await run('market', '2026-10-02');
			expect(day).toContain('105.1');
			expect(day).not.toContain('2026-10-01');
			expect(day).toContain(credit);

			const month = await run('market', '2026-10');
			expect(month).toContain('Month end');
			expect(month).toContain('119');

			const daily = JSON.parse(await run('market', '2026-10', '--daily', '--json'));
			expect(daily.days.map((entry: { date: string }) => entry.date)).toStrictEqual(['2026-10-01', '2026-10-02']);
		});

		test('market CLI: non-trading day exits with a clear error', async () => {
			await expect(run('market', '2026-10-03')).rejects.toMatchObject({
				exitCode: 1,
				stderr: 'No Tokyo market rates for 2026-10-03 (not a trading day, or not published yet)',
			});
		});

		test('market CLI: --daily with a date exits with a clear error', async () => {
			await expect(run('market', '2026-10-01', '--daily')).rejects.toMatchObject({
				exitCode: 1,
				stderr: '--daily needs a month (YYYY-MM), not a date',
			});
		});

		test('effective CLI shows both indices', async () => {
			const output = await run('effective', '2026-09');
			expect(output).toContain('Nominal');
			expect(output).toContain('65');
			expect(output).toContain('CY 2020=100');
		});
	});
}
