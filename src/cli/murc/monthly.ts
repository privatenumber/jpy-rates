import { cli } from 'cleye';
import { fetchMonthly } from '../../murc/fetch-monthly.ts';
import { currencyFlag, jsonFlag } from '../flags.ts';
import {
	exitOnError, fail, normalizeCurrency, pickCurrency, requireResult, style,
} from '../shared.ts';
import { formatMonthly } from './format.ts';

const argv = cli({
	parameters: ['<year>', '<month>'],
	flags: {
		currency: currencyFlag,
		json: jsonFlag,
	},
});

const result = requireResult(
	await exitOnError(fetchMonthly(Number(argv._.year), Number(argv._.month))),
	'No monthly rates found for this period',
);
const currency = argv.flags.currency && normalizeCurrency(argv.flags.currency);
const filtered = currency
	? {
		...result,
		rates: pickCurrency(result.rates, currency),
		localMarketRates: pickCurrency(result.localMarketRates, currency),
	}
	: result;
if (
	currency
	&& Object.keys(filtered.rates).length === 0
	&& Object.keys(filtered.localMarketRates).length === 0
) {
	fail(`Currency ${currency} not found in results`);
}
if (argv.flags.json) {
	console.log(JSON.stringify(filtered));
} else {
	console.log(formatMonthly(filtered, style));
}
