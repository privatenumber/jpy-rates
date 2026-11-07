type FetchOptions = {
    /** Cancels the request, including retries and business-day walkback. */
    signal?: AbortSignal;
};

export type { FetchOptions as F };
