import { cli } from 'cleye';
import { fetchBasicRates } from '../../boj/fetch-basic.ts';
import { currencyFlag, jsonFlag } from '../flags.ts';
import {
	exitOnError, fail, normalizeCurrency, pickCurrency, requireResult, style,
} from '../shared.ts';
import { formatBasic } from './format.ts';
import { parseMonth } from './month.ts';

const argv = cli({
	parameters: ['<month>'],
	flags: {
		currency: currencyFlag,
		json: jsonFlag,
	},
});
const [year, month] = parseMonth(argv._.month);
const result = requireResult(await exitOnError(fetchBasicRates(year, month)), 'No BOJ basic rates found for this month');
const currency = argv.flags.currency && normalizeCurrency(argv.flags.currency);
const cross = currency ? pickCurrency(result.cross, currency) : result.cross;
const reference = currency
	? result.reference.filter(row => row.code === currency)
	: result.reference;
const arbitrated = currency ? pickCurrency(result.arbitrated, currency) : result.arbitrated;
if (currency && currency !== 'USD' && !Object.keys(cross).length && reference.length === 0) {
	fail(`Currency ${currency} not found in results`);
}
const filtered = {
	...result,
	cross,
	reference,
	arbitrated,
};
console.log(argv.flags.json ? JSON.stringify(filtered) : formatBasic(filtered, style, !currency || currency === 'USD'));
