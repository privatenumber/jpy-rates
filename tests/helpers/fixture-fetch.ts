import { murcFixture } from '../murc/fixtures.ts';
import { customsFixture } from '../customs/fixtures.ts';
import { bojFixture } from '../boj/fixtures.ts';
import { statFixture } from '../boj/stat-fixtures.ts';

const urlFromFetchInput = (input: Parameters<typeof fetch>[0]) => {
	if (typeof input === 'string') {
		return input;
	}

	if (input instanceof URL) {
		return input.toString();
	}

	return input.url;
};

// https://jpy-rates.test/status/<id>/<s1>,<s2>,... answers each request to the same
// URL with the next status, repeating the last one, to test retries
const statusAttempts = new Map<string, number>();
const statusSequenceFixture = (url: string): Response | undefined => {
	const match = url.match(/^https:\/\/jpy-rates\.test\/status\/[^/]+\/([\d,]+)$/);
	if (!match) { return undefined; }
	const statuses = match[1]!.split(',').map(Number);
	const attempt = statusAttempts.get(url) ?? 0;
	statusAttempts.set(url, attempt + 1);
	const status = statuses[Math.min(attempt, statuses.length - 1)]!;
	return new Response(`attempt ${attempt + 1}`, { status });
};

export const statusAttemptCount = (url: string): number => statusAttempts.get(url) ?? 0;

// Each source owns the fixtures for its URLs; unmapped URLs fail loudly.
export const createFixtureFetch = (): typeof fetch => async (input) => {
	const url = urlFromFetchInput(input);
	const response = statusSequenceFixture(url)
		?? murcFixture(url)
		?? customsFixture(url)
		?? statFixture(url)
		?? bojFixture(url);
	if (!response) {
		throw new Error(`[fixture-fetch] No synthetic fixture mapped for URL: ${url}`);
	}
	return response;
};
