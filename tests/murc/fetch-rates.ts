import { describe, test, expect } from 'manten';
import spawn from 'nano-spawn';
import { fetchRates } from '../../src/murc/fetch-rates.ts';

const fixtureImportArguments = process.env.JPY_RATES_LIVE
	? []
	: [
		'--import',
		'./tests/helpers/register-fixture-fetch.ts',
	];

// Run a JS expression in an isolated Node process with a specific timezone.
// Returns stdout trimmed.
const evalInTz = async (timezone: string, code: string) => {
	const result = await spawn(
		process.execPath,
		[
			...fixtureImportArguments,
			'--input-type=module',
			'-e',
			code,
		],
		{
			env: {
				...process.env,
				TZ: timezone,
			},
		},
	);
	return result.stdout.trim();
};

describe('fetchRates', () => {
	test('fetches rates for a known business day', async () => {
		const result = await fetchRates('2025-01-06');
		expect(result).not.toBeNull();
		expect(result!.date).toBe('2025-01-06');
		expect(result!.rates.USD).toBeDefined();
		expect(result!.rates.USD.tts).toBeGreaterThan(0);
		expect(result!.rates.USD.ttb).toBeGreaterThan(0);
		expect(result!.rates.USD.ttm).toBeGreaterThan(0);
		expect(result!.rates.USD.name).toBe('US Dollar');
		expect(result!.rates.USD.unit).toBe(1);
	});

	test('KRW and IDR have unit 100', async () => {
		const result = await fetchRates('2025-01-06');
		expect(result).not.toBeNull();
		expect(result!.rates.KRW.unit).toBe(100);
		expect(result!.rates.IDR.unit).toBe(100);
	});

	test('non-business day walks back to preceding business day', async () => {
		// Jan 4, 2025 = Saturday, Jan 3 = bank holiday (年始休暇)
		// Walks back to Dec 30, 2024 (last business day)
		const result = await fetchRates('2025-01-04');
		expect(result).not.toBeNull();
		expect(result!.date).toBe('2024-12-30');
		expect(result!.rates.USD.tts).toBeGreaterThan(0);
	});

	test('works for 1990 dates (pre-Euro)', async () => {
		const result = await fetchRates('1990-01-04');
		expect(result).not.toBeNull();
		expect(result!.rates.DEM).toBeDefined();
		expect(result!.rates.EUR).toBeUndefined();
	});

	test('normalizes legacy Belgian Franc commercial label to BEF per 100 units', async () => {
		// Asserts synthetic fixture values
		if (process.env.JPY_RATES_LIVE) { return; }
		const result = await fetchRates('1994-01-05');
		expect(result).not.toBeNull();
		expect(result!.rates.BEF).toBeDefined();
		expect(result!.rates.BEF.unit).toBe(100);
		expect(result!.rates.BEF.ttm).toBe(310);
	});

	test('MYR is unquoted', async () => {
		const result = await fetchRates('2025-01-06');
		expect(result).not.toBeNull();
		expect(result!.rates.MYR).toBeDefined();
		expect(result!.rates.MYR.tts).toBeNull();
		expect(result!.rates.MYR.ttb).toBeNull();
		expect(result!.rates.MYR.ttm).toBeNull();
	});

	test('accepts Date object', async () => {
		const result = await fetchRates(new Date(2025, 0, 6));
		expect(result).not.toBeNull();
		expect(result!.date).toBe('2025-01-06');
	});

	test('throws on server error (500) instead of returning null', async () => {
		// A 500 on a valid business day should throw, not be silently treated as "no data"
		if (process.env.JPY_RATES_LIVE) {
			return;
		}

		await expect(async () => fetchRates('2025-01-07')).rejects.toThrow('HTTP 500');
	});

	test('fetchRates with string in America/New_York returns correct date', async () => {
		const date = await evalInTz('America/New_York', `
			import { fetchRates } from './src/murc/fetch-rates.ts';
			const result = await fetchRates('2025-01-06');
			console.log(result?.date);
		`);
		expect(date).toBe('2025-01-06');
	});

	if (!process.env.JPY_RATES_LIVE) {
		test('walks back across the ten-day 2019 Golden Week closure', async () => {
			const result = await fetchRates('2019-05-06');
			expect(result!.date).toBe('2019-04-26');
		});

		test('throws on unexpected redirects instead of walking back', async () => {
			await expect(fetchRates('2025-02-12')).rejects.toThrow('Unexpected redirect');
		});

		test('throws on pages without a rate table instead of walking back', async () => {
			await expect(fetchRates('2025-02-13')).rejects.toThrow('Unexpected page structure');
		});
	}

	test('throws RangeError for dates outside the available range', async () => {
		await expect(fetchRates('1989-12-29')).rejects.toThrow(RangeError);
		await expect(fetchRates('2099-01-05')).rejects.toThrow('in the future');
	});

	test('aborts with the caller signal reason', async () => {
		const controller = new AbortController();
		const reason = new Error('Stop');
		controller.abort(reason);
		await expect(fetchRates('2025-01-06', { signal: controller.signal })).rejects.toBe(reason);
	});

	test('rejects malformed rate tables instead of misreading columns', async () => {
		if (process.env.JPY_RATES_LIVE) { return; }
		await expect(fetchRates('2025-03-03')).rejects.toThrow('7 cells are not rows of 6');
		await expect(fetchRates('2025-03-04')).rejects.toThrow('TTM 103 is not the midpoint of TTS 105 and TTB 103');
	});

	test('a no-data redirect to another origin is an error, not a holiday', async () => {
		if (process.env.JPY_RATES_LIVE) { return; }
		await expect(fetchRates('2025-03-05')).rejects.toThrow('Unexpected redirect');
	});
});
