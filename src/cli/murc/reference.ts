import { cli } from 'cleye';
import { fetchReference } from '../../murc/fetch-reference.ts';
import { jsonFlag } from '../flags.ts';
import {
	exitOnError, requireResult, style,
} from '../shared.ts';
import { formatReference } from './format.ts';

const argv = cli({
	parameters: ['<year>'],
	flags: {
		json: jsonFlag,
	},
});

const result = requireResult(
	await exitOnError(fetchReference(Number(argv._.year))),
	'No reference data found for this year',
);
if (argv.flags.json) {
	console.log(JSON.stringify(result));
} else {
	console.log(formatReference(result, style));
}
