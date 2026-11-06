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
		market: {
			description: 'Fetch Tokyo interbank USD/JPY spot rates',
			loader: () => import('./market.ts'),
		},
		effective: {
			description: 'Fetch the yen\'s effective exchange rate indices',
			loader: () => import('./effective.ts'),
		},
	},
});

await argv.runCommand();
