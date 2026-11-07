import { setTimeout } from 'node:timers/promises';

export type FetchOptions = {

	/** Cancels the request, including retries and business-day walkback. */
	signal?: AbortSignal;
};

const userAgent = 'jpy-rates (+https://www.npmjs.com/package/jpy-rates)';
const requestTimeoutMilliseconds = 30_000;
const maxRetries = 2;
const retryDelayMilliseconds = 500;

// Gateway and availability errors are usually transient. Other statuses, such as
// 404 or 500, describe the request or the page and are returned to the caller.
const retryableStatuses = new Set([502, 503, 504]);

// Waits before the next attempt; a caller abort rejects with the caller's reason
const waitBeforeRetry = async (attempt: number, signal?: AbortSignal) => {
	try {
		await setTimeout(retryDelayMilliseconds * (2 ** attempt), undefined, { signal });
	} catch (error) {
		signal?.throwIfAborted();
		throw error;
	}
};

/**
 * Fetches a source URL with a per-attempt timeout. Network errors, timeouts, and
 * HTTP 502/503/504 are retried up to twice with backoff; after the last attempt,
 * a retryable status is returned so the caller reports it.
 */
export const fetchSource = async (
	url: string,
	{ signal }: FetchOptions = {},
): Promise<Response> => {
	let lastError: unknown;
	for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
		if (attempt > 0) { await waitBeforeRetry(attempt - 1, signal); }
		signal?.throwIfAborted();
		const timeout = AbortSignal.timeout(requestTimeoutMilliseconds);
		let response: Response;
		try {
			response = await fetch(url, {
				headers: {
					'user-agent': userAgent,
				},
				redirect: 'manual',
				signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
			});
		} catch (error) {
			// A caller abort stops retrying; network errors and attempt timeouts retry
			signal?.throwIfAborted();
			lastError = error;
			continue;
		}
		if (!retryableStatuses.has(response.status) || attempt === maxRetries) {
			return response;
		}
		// Release the connection of the discarded response
		await response.body?.cancel();
	}

	throw lastError instanceof Error
		? lastError
		: new Error('Request failed after retries');
};
