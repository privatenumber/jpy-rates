import { cli } from 'cleye';

const argv = cli({
	name: 'jpy-rates',
	strictFlags: true,
	commands: {
		guide: {
			description: 'Show which official rate applies to a tax or reporting purpose',
			loader: () => import('./guide.ts'),
		},
		sources: {
			description: 'List the supported rate sources and their terms',
			loader: () => import('./sources.ts'),
		},
		murc: {
			description: 'MUFG Bank customer rates published by MURC (TTS/TTB/TTM)',
			loader: () => import('./murc/index.ts'),
		},
		customs: {
			description: 'Japan Customs weekly rates for import valuation',
			loader: () => import('./customs/index.ts'),
		},
		boj: {
			description: 'Bank of Japan rates designated for foreign exchange reports',
			loader: () => import('./boj/index.ts'),
		},
	},
});

await argv.runCommand();
