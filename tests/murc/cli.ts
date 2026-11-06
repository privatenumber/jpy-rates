import {
	mkdtemp, readFile, rm, writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, test, expect } from 'manten';
import spawn from 'nano-spawn';

const fixtureImportArguments = process.env.JPY_RATES_LIVE
	? []
	: [
		'--import',
		'./tests/helpers/register-fixture-fetch.ts',
	];

const cli = async (arguments_: string[]) => {
	const result = await spawn(process.execPath, [
		...fixtureImportArguments,
		'src/cli/index.ts',
		'murc',
		...arguments_,
	]);
	return result.stdout;
};

const cliResult = async (arguments_: string[]) => spawn(process.execPath, [
	...fixtureImportArguments,
	'src/cli/index.ts',
	'murc',
	...arguments_,
]);

describe('cli', () => {
	test('rates 2025-01-06', async () => {
		const stdout = await cli(['rates', '2025-01-06']);
		expect(stdout).toContain('2025-01-06');
		expect(stdout).toContain('USD');
		expect(stdout).toContain('Code');
	});

	test('daily 2025-01-06', async () => {
		const stdout = await cli(['daily', '2025-01-06']);
		expect(stdout).toContain('2025-01-06');
		expect(stdout).toContain('Cash Rates');
	});

	test('rates 2025-01-06 -c USD', async () => {
		const stdout = await cli(['rates', '2025-01-06', '-c', 'USD']);
		expect(stdout).toContain('USD');
		expect(stdout).not.toContain('EUR');
	});

	test('--help', async () => {
		const stdout = await cli(['--help']);
		expect(stdout).toContain('jpy-rates murc');
		expect(stdout).toContain('rates');
		expect(stdout).toContain('daily');
		expect(stdout).toContain('monthly');
	});

	test('rates 2025-01-04 walks back to preceding business day', async () => {
		const stdout = await cli(['rates', '2025-01-04']);
		expect(stdout).toContain('2024-12-30');
	});

	test('rates 2025-01-06 --json', async () => {
		const stdout = await cli(['rates', '2025-01-06', '--json']);
		const data = JSON.parse(stdout);
		expect(data.rates.USD.ttm).toBeGreaterThan(0);
	});

	test('convert --json converts USD to JPY', async () => {
		const stdout = await cli([
			'convert',
			'--amount',
			'100',
			'--from',
			'USD',
			'--to',
			'JPY',
			'--date',
			'2025-01-06',
			'--json',
		]);
		const result = JSON.parse(stdout);

		expect(result.convertedAmount).toBe(10_400);
		expect(result.from).toBe('USD');
		expect(result.to).toBe('JPY');
		expect(result.rate).toBe('ttm');
		expect(result.sourceDate).toBe('2025-01-06');
	});

	test('convert outputs a readable summary', async () => {
		const stdout = await cli([
			'convert',
			'--amount',
			'100',
			'--from',
			'USD',
			'--to',
			'JPY',
			'--date',
			'2025-01-06',
		]);

		expect(stdout).toContain('100 USD = 10,400 JPY');
		expect(stdout).toContain('Rate: TTM 104.00 JPY per 1 USD');
		expect(stdout).toContain('Date: 2025-01-06');
		expect(stdout).toContain('Source: https://www.murc-kawasesouba.jp/fx/');
	});

	test('convert accepts a negative amount after a numeric flag', async () => {
		for (const amountFlag of ['--amount', '-a']) {
			const stdout = await cli([
				'convert',
				amountFlag,
				'-100',
				'--from',
				'USD',
				'--to',
				'JPY',
				'--date',
				'2025-01-06',
				'--json',
			]);
			const result = JSON.parse(stdout);
			expect(result.amount).toBe(-100);
			expect(result.convertedAmount).toBe(-10_400);
		}
	});

	test('convert applies per-100 quote units', async () => {
		const stdout = await cli([
			'convert',
			'--amount',
			'10000',
			'--from',
			'KRW',
			'--to',
			'JPY',
			'--date',
			'2025-01-06',
		]);

		expect(stdout).toContain('10,000 KRW = 1,072 JPY');
		expect(stdout).toContain('Rate: TTM 10.72 JPY per 100 KRW');
	});

	test('convert supports short flag aliases and selected rate', async () => {
		const stdout = await cli([
			'convert',
			'-a',
			'100',
			'-f',
			'USD',
			'-t',
			'JPY',
			'-d',
			'2025-01-06',
			'-r',
			'tts',
			'--json',
		]);
		const result = JSON.parse(stdout);

		expect(result.convertedAmount).toBe(10_500);
		expect(result.rate).toBe('tts');
	});

	test('convert requires amount flag', async () => {
		await expect(async () => cliResult([
			'convert',
			'--from',
			'USD',
			'--to',
			'JPY',
			'--date',
			'2025-01-06',
		])).rejects.toMatchObject({
			exitCode: 1,
		});
	});

	test('world default outputs formatted table', async () => {
		const stdout = await cli(['world']);
		expect(stdout).toContain('Country');
		expect(stdout).toContain('Market Level');
	});

	test('world --json outputs compact JSON', async () => {
		const stdout = await cli(['world', '--json']);
		expect(stdout).not.toContain('\t');
		JSON.parse(stdout);
	});

	test('daily -c INR works for currencies with rates but no cash rates', async () => {
		const stdout = await cli(['daily', '2025-01-06', '-c', 'INR', '--json']);
		const result = JSON.parse(stdout);
		expect(Object.keys(result.rates)).toEqual(['INR']);
		// INR has no cash rate — cashRates should be empty, not throw
		expect(Object.keys(result.cashRates)).toEqual([]);
	});

	test('daily -c USD filters both rates and cashRates', async () => {
		const stdout = await cli(['daily', '2025-01-06', '-c', 'USD', '--json']);
		const result = JSON.parse(stdout);
		expect(Object.keys(result.rates)).toEqual(['USD']);
		expect(Object.keys(result.cashRates)).toEqual(['USD']);
	});

	test('download-source writes official XLS bytes to disk', async () => {
		const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'jpy-rates-'));
		try {
			const outputPath = path.join(temporaryDirectory, 'murc_2025.xls');
			const stdout = await cli(['download-source', '2025', '--output', outputPath]);
			const xlsBuffer = await readFile(outputPath);

			expect(stdout).toContain('murc_2025.xls');
			expect(stdout).toContain(outputPath);
			expect(xlsBuffer.byteLength).toBeGreaterThan(0);
		} finally {
			await rm(temporaryDirectory, {
				recursive: true,
				force: true,
			});
		}
	});

	test('parse-archive parses a local XLS file', async () => {
		const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'jpy-rates-'));
		try {
			const outputPath = path.join(temporaryDirectory, 'murc_2025.xls');
			await cli(['download-source', '2025', '--output', outputPath]);

			const stdout = await cli(['parse-archive', outputPath, '--json']);
			const result = JSON.parse(stdout);

			expect(result.year).toBe(2025);
			expect(result.source).toContain('murc_2025.xls');
			expect(result.currencies.USD.daily.length).toBeGreaterThan(0);
		} finally {
			await rm(temporaryDirectory, {
				recursive: true,
				force: true,
			});
		}
	});

	test('--currency is case-insensitive and marks per-100-unit quotes', async () => {
		const stdout = await cli(['rates', '2025-01-06', '-c', 'krw']);
		expect(stdout).toContain('KRW*');
		expect(stdout).toContain('* per 100 units');
		expect(stdout).not.toContain('USD');
	});

	test('monthly --currency filters local market rates too', async () => {
		const usd = JSON.parse(await cli(['monthly', '2026', '1', '-c', 'USD', '--json']));
		expect(Object.keys(usd.rates)).toStrictEqual(['USD']);
		expect(usd.localMarketRates).toStrictEqual({});

		const twd = JSON.parse(await cli(['monthly', '2026', '1', '-c', 'TWD', '--json']));
		expect(twd.rates).toStrictEqual({});
		expect(Object.keys(twd.localMarketRates)).toStrictEqual(['TWD']);
	});

	test('rejects unknown flags', async () => {
		const result = await cliResult(['rates', '2025-01-06', '--jsno']).catch(error => error);
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('--jsno');
	});

	test('rejects invalid monthly arguments before requesting', async () => {
		const result = await cliResult(['monthly', 'abc', '1']).catch(error => error);
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('Invalid year and month');
	});

	test('download-source refuses to overwrite without --force', async () => {
		const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'jpy-rates-'));
		try {
			const outputPath = path.join(temporaryDirectory, 'existing.xls');
			await writeFile(outputPath, 'keep');

			const result = await cliResult(['download-source', '2025', '-o', outputPath]).catch(error => error);
			expect(result.exitCode).toBe(1);
			expect(result.stderr).toContain('already exists');
			expect(await readFile(outputPath, 'utf8')).toBe('keep');

			await cli(['download-source', '2025', '-o', outputPath, '--force']);
			expect(await readFile(outputPath, 'utf8')).not.toBe('keep');
		} finally {
			await rm(temporaryDirectory, {
				recursive: true,
				force: true,
			});
		}
	});

	test('piped output has no colors even when COLORTERM is set', async () => {
		const result = await spawn(process.execPath, [
			...fixtureImportArguments,
			'src/cli/index.ts',
			'murc',
			'rates',
			'2025-01-06',
		], {
			env: {
				...process.env,
				COLORTERM: 'truecolor',
				FORCE_COLOR: undefined,
			},
		});
		expect(result.stdout).not.toContain('\u001B[');
	});

	test('convert --purpose selects the rate type', async () => {
		const result = JSON.parse(await cli([
			'convert', '-a', '100', '-f', 'USD', '-t', 'JPY', '-d', '2025-01-06', '-p', 'stock-sale', '--json',
		]));
		expect(result.rate).toBe('ttb');
		expect(result.purpose).toBe('stock-sale');

		const output = await cli(['convert', '-a', '100', '-f', 'USD', '-t', 'JPY', '-d', '2025-01-06', '-p', 'dividend']);
		expect(output).toContain('TTB');
		expect(output).toContain('purpose: dividend');
	});
});
