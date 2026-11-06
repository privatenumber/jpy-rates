import { describe, test, expect } from 'manten';
import spawn from 'nano-spawn';
import { formatDateId, computeTtm, parseRate } from '../../src/murc/utils.ts';
import { formatDate, parseDate } from '../../src/utils/date.ts';

// Run a JS expression in an isolated Node process with a specific timezone.
// Returns stdout trimmed.
const evalInTz = async (timezone: string, code: string) => {
	const result = await spawn(
		process.execPath,
		['--input-type=module', '-e', code],
		{
			env: {
				...process.env,
				TZ: timezone,
			},
		},
	);
	return result.stdout.trim();
};

describe('utils', () => {
	test('formatDate converts a calendar Date to YYYY-MM-DD', () => {
		expect(formatDate(new Date(Date.UTC(2025, 0, 6)))).toBe('2025-01-06');
	});

	test('formatDateId converts a calendar Date to YYMMDD', () => {
		expect(formatDateId(new Date(Date.UTC(2025, 0, 6)))).toBe('250106');
	});

	test('parseDate accepts YYYY-MM-DD string', () => {
		expect(formatDate(parseDate('2025-01-06'))).toBe('2025-01-06');
	});

	test('parseDate accepts Date object and preserves calendar fields', () => {
		expect(formatDate(parseDate(new Date(2025, 0, 6)))).toBe('2025-01-06');
	});

	test('parseDate rejects nonexistent calendar dates', () => {
		expect(() => parseDate('2025-02-29')).toThrow('Invalid date');
	});

	test('string dates do not depend on skipped local midnights', async () => {
		// Brazil skipped 2018-11-04 00:00 local time for DST
		const date = await evalInTz('America/Sao_Paulo', `
			import { parseDate, formatDate } from './src/utils/date.ts';
			console.log(formatDate(parseDate('2018-11-04')));
		`);
		expect(date).toBe('2018-11-04');
	});

	test('parseRate accepts plain and comma-grouped numbers only', () => {
		expect(parseRate('155.43')).toBe(155.43);
		expect(parseRate(' 9,720 ')).toBe(9720);
		expect(parseRate('1,391.50')).toBe(1391.5);
		expect(parseRate('unquoted')).toBeNull();
		expect(parseRate('')).toBeNull();
		expect(parseRate('(1/24)32.83')).toBeNull();
		expect(parseRate('2.60(A)4.30(B)')).toBeNull();
		expect(parseRate('1,23')).toBeNull();
	});

	test('excelDateToIso does not depend on the host timezone', async () => {
		// Asia/Shanghai's 1900 LMT offset (+08:05:43) differs from its current offset
		for (const timezone of ['Asia/Shanghai', 'Pacific/Apia', 'UTC']) {
			const date = await evalInTz(timezone, `
				import { excelDateToIso } from './src/murc/parse-xls.ts';
				console.log(excelDateToIso(45658), excelDateToIso(45839));
			`);
			expect(date).toBe('2025-01-01 2025-07-01');
		}
	});

	test('parseDate throws on invalid string', () => {
		expect(() => parseDate('not-a-date')).toThrow();
	});

	test('computeTtm returns midpoint', () => {
		expect(computeTtm(105.25, 103.75)).toBe(104.5);
	});

	test('computeTtm returns null when either input is null', () => {
		expect(computeTtm(null, 103.75)).toBeNull();
		expect(computeTtm(105.25, null)).toBeNull();
	});

	test('computeTtm rounds to 2 decimal places', () => {
		// (115.9 + 112.7) / 2 = 114.3 but JS gives 114.30000000000001
		const result = computeTtm(115.9, 112.7);
		expect(result).toBe(114.3);
		// (15.9 + 15.3) / 2 = 15.6 but JS gives 15.600000000000001
		const result2 = computeTtm(15.9, 15.3);
		expect(result2).toBe(15.6);
	});

	test('local-midnight Date works in America/New_York', async () => {
		const date = await evalInTz('America/New_York', `
			import { parseDate, formatDate } from './src/utils/date.ts';
			console.log(formatDate(parseDate(new Date(2025, 0, 6))));
		`);
		expect(date).toBe('2025-01-06');
	});

	test('local-midnight Date works in Asia/Tokyo', async () => {
		const date = await evalInTz('Asia/Tokyo', `
			import { parseDate, formatDate } from './src/utils/date.ts';
			console.log(formatDate(parseDate(new Date(2025, 0, 6))));
		`);
		expect(date).toBe('2025-01-06');
	});

	test('UTC-midnight Date works in America/New_York', async () => {
		const date = await evalInTz('America/New_York', `
			import { parseDate, formatDate } from './src/utils/date.ts';
			console.log(formatDate(parseDate(new Date('2025-01-06'))));
		`);
		expect(date).toBe('2025-01-06');
	});

	test('UTC-midnight Date works in Asia/Tokyo', async () => {
		const date = await evalInTz('Asia/Tokyo', `
			import { parseDate, formatDate } from './src/utils/date.ts';
			console.log(formatDate(parseDate(new Date('2025-01-06'))));
		`);
		expect(date).toBe('2025-01-06');
	});

	test('string date works in America/New_York', async () => {
		const date = await evalInTz('America/New_York', `
			import { parseDate, formatDate } from './src/utils/date.ts';
			console.log(formatDate(parseDate('2025-01-06')));
		`);
		expect(date).toBe('2025-01-06');
	});

	test('arbitrary datetime throws', () => {
		expect(() => parseDate(new Date('2025-01-06T12:34:56Z'))).toThrow('Ambiguous');
	});

	test('invalid Date throws', () => {
		expect(() => parseDate(new Date('garbage'))).toThrow('Invalid');
	});
});
