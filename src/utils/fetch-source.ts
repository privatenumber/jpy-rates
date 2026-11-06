export type FetchOptions = {

	/** Cancels the request, including retries and business-day walkback. */
	signal?: AbortSignal;
};

const userAgent = 'jpy-rates (+https://www.npmjs.com/package/jpy-rates)';
const requestTimeoutMilliseconds = 30_000;
const maxRetries = 2;

export const fetchSource = async (
	url: string,
	{ signal }: FetchOptions = {},
): Promise<Response> => {
	let lastError: unknown;
	for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
		signal?.throwIfAborted();
		const timeout = AbortSignal.timeout(requestTimeoutMilliseconds);
		try {
			return await fetch(url, {
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
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error('Request failed after retries');
};
