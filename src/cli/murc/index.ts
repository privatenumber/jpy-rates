import { cli } from 'cleye';

const argv = cli({
	commands: {
		rates: {
			description: 'Fetch exchange rates for a date',
			loader: () => import('./rates.ts'),
		},
		daily: {
			description: 'Fetch daily exchange rates',
			loader: () => import('./daily.ts'),
		},
		convert: {
			description: 'Convert between JPY and one foreign currency',
			loader: () => import('./convert.ts'),
		},
		monthly: {
			description: 'Fetch monthly exchange rates',
			loader: () => import('./monthly.ts'),
		},
		yearly: {
			description: 'Fetch yearly exchange rates',
			loader: () => import('./yearly.ts'),
		},
		world: {
			description: 'Fetch world currency quotations',
			loader: () => import('./world.ts'),
		},
		reference: {
			description: 'Fetch yearly reference rates',
			loader: () => import('./reference.ts'),
		},
		'download-source': {
			description: 'Download the official archive XLS file',
			loader: () => import('./download-source.ts'),
		},
		'parse-archive': {
			description: 'Parse a local archive XLS file',
			loader: () => import('./parse-archive.ts'),
		},
	},
});

await argv.runCommand();
