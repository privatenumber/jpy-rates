import { cli } from 'cleye';
import { fetchReportingRates } from '../../boj/fetch-reporting.ts';
import { currencyFlag, jsonFlag } from '../flags.ts';
import {
	exitOnError, filterCurrency, normalizeCurrency, requireResult, style,
} from '../shared.ts';
import { formatReporting } from './format.ts';
import { parseMonth } from './month.ts';

const argv = cli({
	parameters: ['<month>'],
	flags: {
		currency: currencyFlag,
		json: jsonFlag,
	},
});
const [year, month] = parseMonth(argv._.month);
const result = requireResult(await exitOnError(fetchReportingRates(year, month)), 'No BOJ reporting rates found for this month');
const currency = argv.flags.currency && normalizeCurrency(argv.flags.currency);
const filtered = {
	...result,
	rates: currency ? filterCurrency(result.rates, currency) : result.rates,
};
console.log(argv.flags.json ? JSON.stringify(filtered) : formatReporting(filtered, style));
