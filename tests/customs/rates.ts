import { describe, test, expect } from 'manten';
import { fetchCustomsRates } from '../../src/customs/index.ts';
import { parseCustomsText } from '../../src/customs/parse-pdf.ts';

describe('Customs rates', () => {
	test('maps dates at week boundaries and resolves published rates', async () => {
		if (process.env.JPY_RATES_LIVE) { return; }
		const first = await fetchCustomsRates('2026-10-04');
		const last = await fetchCustomsRates('2026-10-10');
		const next = await fetchCustomsRates(new Date('2026-10-11'));
		expect(first!.period).toEqual({
			start: '2026-10-04',
			end: '2026-10-10',
		});
		expect(last!.period).toEqual(first!.period);
		expect(next!.period).toEqual({
			start: '2026-10-11',
			end: '2026-10-17',
		});
		expect(first!.rates.USD.rate).toBe(100);
		expect(first!.rates.KRW.unit).toBe(100);
		expect(first!.rates.KRW.rate).toBe(12.34);
		expect(first!.rates.XCD.countries).toEqual(['島国他']);
		expect(first!.rates.BND.equivalentTo).toBe('SGD');
		expect(first!.rates.BND.rate).toBe(first!.rates.SGD.rate);
		expect((await fetchCustomsRates('2019-10-09'))!.period).toEqual({
			start: '2019-10-06',
			end: '2019-10-12',
		});
		expect(await fetchCustomsRates('2099-01-01')).toBeNull();
		await expect(async () => fetchCustomsRates('2000-01-01')).rejects.toThrow('earliest');
	});

	test('validates Japanese era dates and PDF periods', () => {
		const row = [
			{
				str: '101',
				x: 75,
				y: 500,
			},
			{
				str: '架空国',
				x: 110,
				y: 500,
			},
			{
				str: 'ドル',
				x: 294,
				y: 500,
			},
			{
				str: 'USD',
				x: 370,
				y: 500,
			},
			{
				str: '10.00',
				x: 440,
				y: 500,
			},
		];
		const page = (date: string) => [[{
			str: date,
			x: 50,
			y: 700,
		}, ...row]];
		const period = {
			start: '2019-04-28',
			end: '2019-05-04',
		};
		expect(parseCustomsText(page('適用期間：平成31年4月28日から令和元年5月4日まで'), period).USD.rate).toBe(10);
		expect(parseCustomsText(page('適用期間：平成31年4月28日から平成31年（2019年）5月4日まで'), period).USD.rate).toBe(10);
		expect(() => parseCustomsText(page('適用期間：平成31年4月28日から平成31年（2020年）5月4日まで'), period)).toThrow('does not match Western year');
		expect(() => parseCustomsText(page('適用期間：平成31年4月28日から平成31年5月4日まで'), period)).toThrow('Invalid Japanese era date');
		expect(() => parseCustomsText(page('適用期間：平成31年4月28日から令和元年5月4日まで'), {
			start: '2019-04-29',
			end: period.end,
		})).toThrow('does not match');
		const unresolved = page('適用期間：平成31年4月28日から令和元年5月4日まで');
		unresolved[0]![5]!.str = '架空通貨と等価';
		expect(() => parseCustomsText(unresolved, period)).toThrow('Cannot resolve equivalent currency');
		const unrecognized = page('適用期間：平成31年4月28日から令和元年5月4日まで');
		unrecognized[0]![4]!.str = 'US?';
		expect(() => parseCustomsText(unrecognized, period)).toThrow('row markers');
	});
});
