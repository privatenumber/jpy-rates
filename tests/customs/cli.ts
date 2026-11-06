import { describe, test, expect } from 'manten';
import spawn from 'nano-spawn';

const run = async (arguments_: string[]) => spawn(process.execPath, [
	'--import',
	'./tests/helpers/register-fixture-fetch.ts',
	'src/cli/index.ts',
	'customs',
	...arguments_,
]);

describe('Customs CLI', () => {
	test('formats the weekly table and per-100 footnote', async () => {
		const { stdout } = await run(['2026-10-04']);
		expect(stdout).toContain('2026-10-04 - 2026-10-10');
		expect(stdout).toContain('KRW*');
		expect(stdout).toContain('* per 100 units');
		expect(stdout).toContain('Derived from SGD');
		expect(stdout).toContain('Source: https://');
		expect(stdout).toContain('PDL1.0');
	});
	test('filters JSON case-insensitively', async () => {
		const { stdout } = await run(['2026-10-04', '-c', 'krw', '--json']);
		const result = JSON.parse(stdout);
		expect(Object.keys(result.rates)).toEqual(['KRW']);
		expect(result.rates.KRW.rate).toBe(12.34);
	});
	test('rejects an unknown currency', async () => {
		const result = await run(['2026-10-04', '-c', 'unknown']).catch(error => error);
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('Currency UNKNOWN not found');
	});
});
