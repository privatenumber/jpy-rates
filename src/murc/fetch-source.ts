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
		const destination = location ? new URL(location, url) : undefined;
		const isSameOrigin = destination?.origin === new URL(url).origin;
		if (isSameOrigin && noDataRedirectPaths.has(destination!.pathname)) {
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

// MURC's pages are rendered by PHP, which prints errors into the HTML, such as
// "<b>Fatal error</b>: Uncaught Error: Failed opening required 'inc/2610.html'
// ... on line <b>122</b>".
// A fatal error also stops the rest of the page from rendering.
export const findServerError = (html: string): string | null => (
	html.replaceAll(/<[^>]+>/g, '').match(/\b(?:Fatal error|Parse error|Warning): .+? on line \d+/s)?.[0]
		.replaceAll(/\s+/g, ' ') ?? null
);

// Pass the page HTML so a server error on the page is named as the likely cause
export const unexpectedPageError = (url: string, detail: string, html?: string): Error => {
	const serverError = html === undefined ? null : findServerError(html);
	return new Error(`Unexpected page structure (${detail})${serverError ? `; the page shows a server error: ${serverError}` : ''}: ${url}`);
};
