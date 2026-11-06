import { cli } from 'cleye';
import { fetchEffectiveRates } from '../../boj/fetch-effective.ts';
import { jsonFlag } from '../flags.ts';
import {
	exitOnError, fail, requireResult, style,
} from '../shared.ts';
import { formatEffective } from './format.ts';

const argv = cli({
	parameters: ['<month>'],
	flags: {
		json: jsonFlag,
	},
	help: {
		description: 'The yen\'s nominal and real effective exchange rate indices for a month (YYYY-MM)',
	},
});

const match = argv._.month.match(/^(\d{4})-(\d{2})$/);
if (!match) { fail('Expected month in YYYY-MM format'); }
const result = requireResult(
	await exitOnError(fetchEffectiveRates(Number(match![1]), Number(match![2]))),
	`No effective exchange rate indices published for ${argv._.month}`,
);
console.log(argv.flags.json ? JSON.stringify(result) : formatEffective(result, style));
