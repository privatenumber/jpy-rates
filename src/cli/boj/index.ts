import { cli } from 'cleye';

const argv = cli({
	commands: {
		basic: {
			description: 'Fetch basic and cross rates',
			loader: () => import('./basic.ts'),
		},
		reporting: {
			description: 'Fetch reporting ordinance rates',
			loader: () => import('./reporting.ts'),
		},
	},
});

await argv.runCommand();
