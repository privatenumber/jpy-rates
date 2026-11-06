import { fetchSource, type FetchOptions } from '../utils/fetch-source.ts';

// The source redirects requests for dates without published rates
// (weekends, holidays, unpublished or out-of-range dates) to these pages.
const noDataRedirectPaths = new Set([
	'/fx/index.php',
	'/fx/past_3month.php',
]);

// Fetch a Shift_JIS HTML page. Returns null when the source redirects to a known
// "no data" page. Throws on any other non-2xx response, including unexpected
// redirects such as maintenance pages, so they are not mistaken for holidays.
export const fetchShiftJisHtml = async (
	url: string,
	options?: FetchOptions,
): Promise<string | null> => {
	const response = await fetchSource(url, options);
	if (response.status === 301 || response.status === 302) {
		const location = response.headers.get('location');
		if (location && noDataRedirectPaths.has(new URL(location, url).pathname)) {
			return null;
		}
		throw new Error(`Unexpected redirect (HTTP ${response.status}) to ${location ?? 'unknown location'}: ${url}`);
	}

	if (response.status < 200 || response.status >= 300) {
		throw new Error(`HTTP ${response.status}: ${url}`);
	}

	const buffer = await response.arrayBuffer();
	return new TextDecoder('shift_jis').decode(buffer);
};

export const unexpectedPageError = (url: string, detail: string): Error => new Error(
	`Unexpected page structure (${detail}): ${url}`,
);
