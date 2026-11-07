import { parseHTML } from 'linkedom';
import { f as fetchSource } from './fetch-source-BHAj9IoI.mjs';
import { m as multiplyDecimals } from './number-DrM6UAah.mjs';
import { m as monthParts, i as isUnannounced, b as baseUrl, j as japaneseMonth, a as attribution } from './common-BWRtWuj4.mjs';

const currencyNames = {
  \u30A2\u30E9\u30D6\u9996\u9577\u56FD\u9023\u90A6\u30C7\u30A3\u30EB\u30CF\u30E0: "AED",
  "\u30A2\u30EB\u30BC\u30F3\u30C1\u30F3\u30FB\u30DA\u30BD": "ARS",
  "\u30A4\u30B9\u30E9\u30A8\u30EB\u30FB\u30B7\u30A7\u30B1\u30EB": "ILS",
  "\u30A4\u30E9\u30F3\u30FB\u30EA\u30A2\u30EB": "IRR",
  "\u30A4\u30F3\u30C9\u30FB\u30EB\u30D4\u30FC": "INR",
  "\u30A4\u30F3\u30C9\u30CD\u30B7\u30A2\u30FB\u30EB\u30D4\u30A2": "IDR",
  "\u30AA\u30FC\u30B9\u30C8\u30E9\u30EA\u30A2\u30FB\u30C9\u30EB": "AUD",
  "\u30AA\u30DE\u30FC\u30F3\u30FB\u30EA\u30A2\u30EB": "OMR",
  "\u30AB\u30BF\u30FC\u30EB\u30FB\u30EA\u30A2\u30EB": "QAR",
  \u97D3\u56FD\u30A6\u30A9\u30F3: "KRW",
  "\u30AB\u30F3\u30DC\u30B8\u30A2\u30FB\u30EA\u30A8\u30EB": "KHR",
  "\u30AF\u30A6\u30A7\u30FC\u30C8\u30FB\u30C7\u30A3\u30CA\u30FC\u30EB": "KWD",
  "\u30B1\u30CB\u30A2\u30FB\u30B7\u30EA\u30F3\u30B0": "KES",
  "\u30B3\u30ED\u30F3\u30D3\u30A2\u30FB\u30DA\u30BD": "COP",
  "\u30B5\u30A6\u30B8\u30A2\u30E9\u30D3\u30A2\u30FB\u30EA\u30A2\u30EB": "SAR",
  "\u30B7\u30F3\u30AC\u30DD\u30FC\u30EB\u30FB\u30C9\u30EB": "SGD",
  \u65B0\u53F0\u6E7E\u30C9\u30EB: "TWD",
  "\u30B9\u30EA\u30E9\u30F3\u30AB\u30FB\u30EB\u30D4\u30FC": "LKR",
  "\u30BB\u30FC\u30B7\u30A7\u30EB\u30FB\u30EB\u30D4\u30FC": "SCR",
  "\u30BF\u30A4\u30FB\u30D0\u30FC\u30C4": "THB",
  "\u30BF\u30D2\u30C1\u30FB\u30D1\u30B7\u30D5\u30A3\u30C3\u30AF\u30D5\u30E9\u30F3": "XPF",
  "\u30C1\u30A7\u30B3\u30FB\u30B3\u30EB\u30CA": "CZK",
  "\u30C1\u30EA\u30FB\u30DA\u30BD": "CLP",
  "\u30C7\u30F3\u30DE\u30FC\u30AF\u30FB\u30AF\u30ED\u30FC\u30CD": "DKK",
  "\u30C8\u30EA\u30CB\u30C0\u30FC\u30C9\u30FB\u30C8\u30D0\u30B4\u30FB\u30C9\u30EB": "TTD",
  "\u30C8\u30EB\u30B3\u30FB\u30EA\u30E9": "TRY",
  "\u30CA\u30A4\u30B8\u30A7\u30EA\u30A2\u30FB\u30CA\u30A4\u30E9": "NGN",
  "\u30CB\u30E5\u30FC\u30B8\u30FC\u30E9\u30F3\u30C9\u30FB\u30C9\u30EB": "NZD",
  "\u30CE\u30EB\u30A6\u30A7\u30FC\u30FB\u30AF\u30ED\u30FC\u30CD": "NOK",
  "\u30D1\u30AD\u30B9\u30BF\u30F3\u30FB\u30EB\u30D4\u30FC": "PKR",
  "\u30D0\u30CC\u30A2\u30C4\u30FB\u30D0\u30C4": "VUV",
  "\u30D1\u30D7\u30A2\u30CB\u30E5\u30FC\u30AE\u30CB\u30A2\u30FB\u30AD\u30CA": "PGK",
  "\u30D0\u30FC\u30EC\u30FC\u30F3\u30FB\u30C7\u30A3\u30CA\u30FC\u30EB": "BHD",
  "\u30CF\u30F3\u30AC\u30EA\u30FC\u30FB\u30D5\u30A9\u30EA\u30F3\u30C8": "HUF",
  "\u30D0\u30F3\u30B0\u30E9\u30C7\u30B7\u30E5\u30FB\u30BF\u30AB": "BDT",
  "\u30D5\u30A3\u30B8\u30FC\u30FB\u30C9\u30EB": "FJD",
  "\u30D5\u30A3\u30EA\u30D4\u30F3\u30FB\u30DA\u30BD": "PHP",
  "\u30D6\u30E9\u30B8\u30EB\u30FB\u30EC\u30A2\u30EB": "BRL",
  "\u30D6\u30EB\u30CD\u30A4\u30FB\u30C9\u30EB": "BND",
  "\u30D9\u30C8\u30CA\u30E0\u30FB\u30C9\u30F3": "VND",
  "\u30DA\u30EB\u30FC\u30FB\u30CC\u30A8\u30DC\u30FB\u30BD\u30EB": "PEN",
  "\u30DD\u30FC\u30E9\u30F3\u30C9\u30FB\u30BA\u30ED\u30C1": "PLN",
  \u9999\u6E2F\u30C9\u30EB: "HKD",
  "\u30DE\u30EC\u30FC\u30B7\u30A2\u30FB\u30EA\u30F3\u30AE\u30C3\u30C8": "MYR",
  "\u5357\u30A2\u30D5\u30EA\u30AB\u30FB\u30E9\u30F3\u30C8": "ZAR",
  "\u30DF\u30E3\u30F3\u30DE\u30FC\u30FB\u30C1\u30E3\u30C3\u30C8": "MMK",
  "\u30E1\u30AD\u30B7\u30B3\u30FB\u30DA\u30BD": "MXN",
  "\u30E2\u30FC\u30EA\u30B7\u30E3\u30B9\u30FB\u30EB\u30D4\u30FC": "MUR",
  "\u30E2\u30ED\u30C3\u30B3\u30FB\u30C7\u30A3\u30EB\u30CF\u30E0": "MAD",
  "\u30E8\u30EB\u30C0\u30F3\u30FB\u30C7\u30A3\u30CA\u30FC\u30EB": "JOD",
  "\u30E9\u30AA\u30B9\u30FB\u30AD\u30C3\u30D7": "LAK",
  "\u30EB\u30FC\u30DE\u30CB\u30A2\u30FB\u30EC\u30A4": "RON",
  "\u30EB\u30EF\u30F3\u30C0\u30FB\u30D5\u30E9\u30F3": "RWF",
  "\u30ED\u30B7\u30A2\u30FB\u30EB\u30FC\u30D6\u30EB": "RUB"
};

const crossNames = {
  "\u30AB\u30CA\u30C0\u30FB\u30C9\u30EB": "CAD",
  \u4E2D\u56FD\u5143: "CNY",
  "\u30B9\u30A6\u30A7\u30FC\u30C7\u30F3\u30FB\u30AF\u30ED\u30FC\u30CD": "SEK",
  "\u30B9\u30A4\u30B9\u30FB\u30D5\u30E9\u30F3": "CHF",
  "\u30B9\u30BF\u30FC\u30EA\u30F3\u30B0\u30FB\u30DD\u30F3\u30C9": "GBP",
  \u30E6\u30FC\u30ED: "EUR"
};
const fetchBasicRates = async (year, month, options) => {
  const requested = monthParts(year, month);
  const source = `${baseUrl}/kijun/kiju${requested.suffix}.htm`;
  const response = await fetchSource(source, options);
  if (isUnannounced(response, requested.month)) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${source}`);
  }
  const { document } = parseHTML(await response.text());
  const contents = document.querySelector("#contents");
  const title = contents?.querySelector("h1")?.textContent ?? "";
  const basicText = Array.from(contents?.querySelectorAll("p") ?? []).map((element) => element.textContent ?? "").find((text) => text.includes("1\u7C73\u30C9\u30EB\u306B\u3064\u304D\u672C\u90A6\u901A\u8CA8"));
  const basic = Number(basicText?.normalize("NFKC").match(/1米ドルにつき本邦通貨\s*[:：]\s*(\d+(?:\.\d+)?)円/)?.[1]);
  const referenceHeading = Array.from(contents?.querySelectorAll("h4") ?? []).find((element) => element.textContent?.includes("\u5E02\u5834\u5B9F\u52E2\u76F8\u5834"));
  const referenceMonth = japaneseMonth(referenceHeading?.textContent ?? "");
  const cross = {};
  for (const row of contents?.querySelectorAll("tr") ?? []) {
    const text = (row.textContent ?? "").normalize("NFKC").replaceAll(/\s/g, "");
    const match = text.match(/\(1(.+?)につき本邦通貨\)(\d+(?:\.\d+)?)円/);
    if (match && crossNames[match[1]]) {
      cross[crossNames[match[1]]] = Number(match[2]);
    }
  }
  const reference = [];
  for (const element of contents?.querySelectorAll("li") ?? []) {
    const text = (element.textContent ?? "").normalize("NFKC").replaceAll(/\s/g, "");
    const match = text.match(/^(\d+)(\D+?)につき(\d+(?:\.\d+)?|[─―－-])米ドル$/);
    if (!match && text.includes("\u306B\u3064\u304D") && text.endsWith("\u7C73\u30C9\u30EB")) {
      throw new Error(`Unexpected BOJ market rate "${text}": ${source}`);
    }
    if (match) {
      const nameJa = match[2];
      const code = nameJa.startsWith("\u30D9\u30CD\u30BA\u30A8\u30E9") ? requested.month < "2018-10" ? "VEB" : "VES" : currencyNames[nameJa] ?? null;
      reference.push({
        code,
        nameJa,
        unit: Number(match[1]),
        usd: /^\d+(?:\.\d+)?$/.test(match[3]) ? Number(match[3]) : null
      });
    }
  }
  if (japaneseMonth(title) !== requested.month || !basic || !referenceMonth || Object.keys(cross).length !== 6 || !reference.length) {
    throw new Error(`Unexpected BOJ basic rates page: ${source}`);
  }
  return {
    source,
    attribution,
    month: requested.month,
    basic,
    cross,
    referenceMonth,
    reference,
    arbitrated: Object.fromEntries(reference.flatMap((row) => row.code !== null && row.usd !== null ? [[row.code, {
      unit: row.unit,
      rate: multiplyDecimals(row.usd, basic)
    }]] : []))
  };
};

export { fetchBasicRates as f };
