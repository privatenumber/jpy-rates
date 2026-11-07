import { f as fetchSource } from './fetch-source-BHAj9IoI.mjs';

const noDataRedirectPaths = /* @__PURE__ */ new Set([
  "/fx/index.php",
  "/fx/past_3month.php"
]);
const fetchShiftJisHtml = async (url, options) => {
  const response = await fetchSource(url, options);
  if (response.status === 301 || response.status === 302) {
    const location = response.headers.get("location");
    const destination = location ? new URL(location, url) : void 0;
    const isSameOrigin = destination?.origin === new URL(url).origin;
    if (isSameOrigin && noDataRedirectPaths.has(destination.pathname)) {
      return null;
    }
    throw new Error(`Unexpected redirect (HTTP ${response.status}) to ${location ?? "unknown location"}: ${url}`);
  }
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return new TextDecoder("shift_jis").decode(buffer);
};
const findServerError = (html) => html.replaceAll(/<[^>]+>/g, "").match(/\b(?:Fatal error|Parse error|Warning): .+? on line \d+/s)?.[0].replaceAll(/\s+/g, " ") ?? null;
const unexpectedPageError = (url, detail, html) => {
  const serverError = html === void 0 ? null : findServerError(html);
  return new Error(`Unexpected page structure (${detail})${serverError ? `; the page shows a server error: ${serverError}` : ""}: ${url}`);
};

export { findServerError as a, fetchShiftJisHtml as f, unexpectedPageError as u };
