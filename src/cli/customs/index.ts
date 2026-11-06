import { cli } from 'cleye';
import { fetchCustomsRates } from '../../customs/index.ts';
import { currencyFlag, jsonFlag } from '../flags.ts';
import { formatTable } from '../format-table.ts';
import {
	exitOnError, filterCurrency, normalizeCurrency, requireResult, style,
} from '../shared.ts';

const argv = cli({
	parameters: ['<date>'],
	flags: {
		currency: currencyFlag,
		json: jsonFlag,
	},
});
const result = requireResult(await exitOnError(fetchCustomsRates(argv._.date)), 'No Customs rates published for this date');
const filtered = argv.flags.currency
	? {
		...result,
		rates: filterCurrency(result.rates, normalizeCurrency(argv.flags.currency)),
	}
	: result;
if (argv.flags.json) {
	console.log(JSON.stringify(filtered));
} else {
	const entries = Object.values(filtered.rates);
	const rows = entries.map(rate => [
		style.bold(rate.unit === 100 ? `${rate.code}*` : rate.code),
		rate.countries.join(', '),
		rate.currencyJa,
		rate.rate.toFixed(2),
		rate.equivalentTo ? `Derived from ${rate.equivalentTo}` : '',
	]);
	const sections = [
		style.bold(`${result.period.start} - ${result.period.end}`),
		'',
		formatTable([{ header: 'Code' }, { header: 'Country' }, { header: 'Currency' }, {
			header: 'JPY',
			align: 'right',
		}, { header: 'Note' }], rows, style),
	];
	if (entries.some(rate => rate.unit === 100)) { sections.push('', style.dim('* per 100 units')); }
	sections.push('', `Source: ${result.source}`, result.attribution);
	console.log(sections.join('\n'));
}
