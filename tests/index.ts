import { describe } from 'manten';
import { createFixtureFetch } from './helpers/fixture-fetch.ts';

// Default: offline fixture-backed tests. Set JPY_RATES_LIVE=1 for network tests.
if (!process.env.JPY_RATES_LIVE) {
	globalThis.fetch = createFixtureFetch();
}

describe('jpy-rates', () => {
	import('./format-table.ts');
	import('./guide.ts');
	import('./murc/index.ts');
	import('./customs/index.ts');
	import('./boj/index.ts');
	import('./fetch-source.ts');
});
