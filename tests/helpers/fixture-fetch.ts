import { murcFixture } from '../murc/fixtures.ts';
import { customsFixture } from '../customs/fixtures.ts';
import { bojFixture } from '../boj/fixtures.ts';

const urlFromFetchInput = (input: Parameters<typeof fetch>[0]) => {
	if (typeof input === 'string') {
		return input;
	}

	if (input instanceof URL) {
		return input.toString();
	}

	return input.url;
};

// Each source owns the fixtures for its URLs; unmapped URLs fail loudly.
export const createFixtureFetch = (): typeof fetch => async (input) => {
	const url = urlFromFetchInput(input);
	const response = murcFixture(url) ?? customsFixture(url) ?? bojFixture(url);
	if (!response) {
		throw new Error(`[fixture-fetch] No synthetic fixture mapped for URL: ${url}`);
	}
	return response;
};
