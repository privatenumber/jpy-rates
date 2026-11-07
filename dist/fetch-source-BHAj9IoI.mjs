import { setTimeout } from 'node:timers/promises';

const userAgent = "jpy-rates (+https://www.npmjs.com/package/jpy-rates)";
const requestTimeoutMilliseconds = 3e4;
const maxRetries = 2;
const retryDelayMilliseconds = 500;
const retryableStatuses = /* @__PURE__ */ new Set([502, 503, 504]);
const waitBeforeRetry = async (attempt, signal) => {
  try {
    await setTimeout(retryDelayMilliseconds * 2 ** attempt, void 0, { signal });
  } catch (error) {
    signal?.throwIfAborted();
    throw error;
  }
};
const fetchSource = async (url, { signal } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (attempt > 0) {
      await waitBeforeRetry(attempt - 1, signal);
    }
    signal?.throwIfAborted();
    const timeout = AbortSignal.timeout(requestTimeoutMilliseconds);
    let response;
    try {
      response = await fetch(url, {
        headers: {
          "user-agent": userAgent
        },
        redirect: "manual",
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout
      });
    } catch (error) {
      signal?.throwIfAborted();
      lastError = error;
      continue;
    }
    if (!retryableStatuses.has(response.status) || attempt === maxRetries) {
      return response;
    }
    await response.body?.cancel();
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed after retries");
};

export { fetchSource as f };
