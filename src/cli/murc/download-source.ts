import { writeFile } from 'node:fs/promises';
import { cli } from 'cleye';
import { downloadArchiveSource, getArchiveSourceUrl } from '../../murc/archive.ts';
import { exitOnError } from '../shared.ts';

const argv = cli({
	parameters: ['<year>'],
	flags: {
		output: {
			type: String,
			alias: 'o',
			description: 'Output XLS path',
		},
		force: {
			type: Boolean,
			description: 'Overwrite the output file if it exists',
		},
	},
});

const year = Number(argv._.year);
const outputPath = argv.flags.output ?? `murc_${year}.xls`;
const xlsBuffer = await exitOnError(downloadArchiveSource(year));
await exitOnError(
	writeFile(outputPath, new Uint8Array(xlsBuffer), {
		// Refuse to replace an existing file unless --force is passed
		flag: argv.flags.force ? 'w' : 'wx',
	}).catch((error: unknown) => {
		if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
			throw new Error(`${outputPath} already exists (pass --force to overwrite)`);
		}
		throw error;
	}),
);
console.log(`Downloaded ${getArchiveSourceUrl(year)} to ${outputPath}`);
