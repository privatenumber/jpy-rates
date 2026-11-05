import { cli } from 'cleye';
import { fetchDaily } from '../../api/fetch-daily.ts';
import { currencyFlag, jsonFlag } from '../flags.ts';
import { formatDaily } from '../format.ts';
import {
	exitOnError, filterCurrency, normalizeCurrency, pickCurrency, requireResult, style,
} from '../shared.ts';

const argv = cli({
	parameters: ['[date]'],
	flags: {
		currency: currencyFlag,
		json: jsonFlag,
	},
});

const result = requireResult(
	await exitOnError(fetchDaily(argv._.date)),
	'No daily rates found for this date (non-business day or out of range)',
);
const currency = argv.flags.currency && normalizeCurrency(argv.flags.currency);
const filtered = currency
	? {
		...result,
		rates: filterCurrency(result.rates, currency),
		cashRates: pickCurrency(result.cashRates, currency),
	}
	: result;
if (argv.flags.json) {
	console.log(JSON.stringify(filtered));
} else {
	console.log(formatDaily(filtered, style));
}
