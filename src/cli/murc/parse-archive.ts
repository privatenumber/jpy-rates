import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { cli } from 'cleye';
import { parseArchiveWorkbook } from '../../murc/archive.ts';
import { jsonFlag } from '../flags.ts';
import { exitOnError, style } from '../shared.ts';
import { formatArchive } from './format.ts';

const argv = cli({
	parameters: ['<file>'],
	flags: {
		json: jsonFlag,
	},
});

const xlsBuffer = await exitOnError(readFile(argv._.file));
const result = await exitOnError(parseArchiveWorkbook(xlsBuffer, {
	sourceUrl: pathToFileURL(path.resolve(argv._.file)).href,
}));
if (argv.flags.json) {
	console.log(JSON.stringify(result));
} else {
	console.log(formatArchive(result, style));
}
