import { describe, expect, test } from 'manten';
import spawn from 'nano-spawn';

if (!process.env.JPY_RATES_LIVE) {
	const run = async (...args: string[]) => {
		const result = await spawn(process.execPath, ['--import', './tests/helpers/register-fixture-fetch.ts', 'src/cli/index.ts', 'boj', ...args]);
		return result.stdout;
	};
	describe('BOJ CLI', () => {
		test('basic table filters references case-insensitively', async () => {
			const output = await run('basic', '2026-11', '-c', 'krw');
			expect(output).toContain('KRW');
			expect(output).toContain('100');
			expect(output).toContain('11.2');
			expect(output).toContain('derived');
			expect(output).not.toContain('CAD');
		});
		test('basic shows currencies published without a rate', async () => {
			const output = await run('basic', '2021-05', '-c', 'mmk');
			expect(output).toContain('MMK');
			expect(output).toContain('no rate published');
		});
		test('reporting JSON filters currencies', async () => {
			const output = await run('reporting', '2026-11', '-c', 'krw', '--json');
			expect(JSON.parse(output).rates).toStrictEqual({
				KRW: {
					code: 'KRW',
					unit: 100,
					usd: 0.08,
				},
			});
		});
		test('reporting table and basic JSON', async () => {
			const table = await run('reporting', '2026-11');
			expect(table).toContain('USD');
			expect(table).toContain('convert amounts to USD');
			expect(JSON.parse(await run('basic', '2026-11', '--json')).basic).toBe(140);
		});
		test('basic filters VES', async () => {
			const output = await run('basic', '2026-11', '-c', 'ves');
			expect(output).toContain('VES');
			expect(output).toContain('28');
			expect(output).not.toContain('KRW');
		});
		test('invalid month exits with a clear error', async () => {
			try {
				await run('basic', 'bad-month');
				throw new Error('expected failure');
			} catch (error) {
				expect(error).toMatchObject({
					exitCode: 1,
					stderr: 'Expected month in YYYY-MM format',
				});
			}
		});
	});
}
