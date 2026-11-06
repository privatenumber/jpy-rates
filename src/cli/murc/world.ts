import { cli } from 'cleye';
import { fetchWorld } from '../../murc/fetch-world.ts';
import { jsonFlag } from '../flags.ts';
import { exitOnError, style } from '../shared.ts';
import { formatWorld } from './format.ts';

const argv = cli({
	flags: {
		json: jsonFlag,
	},
});

const result = await exitOnError(fetchWorld());
if (argv.flags.json) {
	console.log(JSON.stringify(result));
} else {
	console.log(formatWorld(result, style));
}
