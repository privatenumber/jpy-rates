import { setTimeout } from 'node:timers/promises';
import { describe, test, expect } from 'manten';
import { fetchSource } from '../src/utils/fetch-source.ts';
import { statusAttemptCount } from './helpers/fixture-fetch.ts';

if (!process.env.JPY_RATES_LIVE) {
	describe('fetchSource', () => {
		const url = (id: string, statuses: string) => `https://jpy-rates.test/status/${id}/${statuses}`;

		test('retries a transient 503 and returns the recovered response', async () => {
			const target = url('recovers', '503,503,200');
			const response = await fetchSource(target);
			expect(response.status).toBe(200);
			expect(await response.text()).toBe('attempt 3');
		});

		test('returns the last retryable status after two retries', async () => {
			const target = url('stays-down', '502');
			const response = await fetchSource(target);
			expect(response.status).toBe(502);
			expect(statusAttemptCount(target)).toBe(3);
		});

		test('does not retry other server errors', async () => {
			const target = url('not-transient', '500,200');
			const response = await fetchSource(target);
			expect(response.status).toBe(500);
			expect(statusAttemptCount(target)).toBe(1);
		});

		test('an abort during the retry delay rejects with the caller\'s reason', async () => {
			const controller = new AbortController();
			const target = url('aborted', '503');
			// Capture the outcome now so the rejection is never unhandled
			const outcome = fetchSource(target, { signal: controller.signal })
				.then(() => undefined, (error: unknown) => error);
			// The first attempt returned 503, so the request is now in the retry delay
			while (statusAttemptCount(target) === 0) { await setTimeout(5); }
			controller.abort(new Error('caller stopped'));
			expect(await outcome).toMatchObject({ message: 'caller stopped' });
			expect(statusAttemptCount(target)).toBe(1);
		});
	});
}
