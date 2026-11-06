# Bank of Japan source behavior

Verified 2026-11-06 against the live site with the package fetchers ([`src/boj/fetch-basic.ts`](../../src/boj/fetch-basic.ts), [`src/boj/fetch-reporting.ts`](../../src/boj/fetch-reporting.ts)).

## Coverage and formats

Both indexes ([基準・裁定](https://www.boj.or.jp/about/services/tame/tame_rate/kijun/index.htm), [報告省令レート](https://www.boj.or.jp/about/services/tame/tame_rate/index.htm)) start at 2016-01.

- Basic and cross rates: one HTML page per month, `kijun/kiju<YYMM>.htm`.
- Reporting ordinance rates: XLSX (`syorei/data/hou<YYMM>.xlsx`, sheet `省令`) from 2017-03. Before that the index links ZIP files; the adapter reads the equivalent HTML page `syorei/hou<YYMM>.htm` instead. Evidence gap: the ZIP contents were not inspected.
- An unannounced month returns HTTP 404; the adapter returns `null` only when the month is also in the future (Japan time) and throws otherwise.

| Month | Basic JPY/USD | Reference month | Reference rows | Reporting entries |
| --- | ---: | --- | ---: | ---: |
| 2016-01 | 123 | 2015-11 | 55 | 62 |
| 2018-09 | 111 | 2018-07 | 55 | 62 |
| 2026-11 | 156 | 2026-09 | 55 | 62 |

## Quote directions

- Basic rate: JPY per 1 USD. Cross rates: JPY per 1 unit for CAD, CNY, SEK, CHF, GBP, and EUR.
- Reference rows on the basic page: USD per stated units of each other currency, for a month two months earlier (for example `100 韓国ウォン につき 0.0736 米ドル`).
- Reporting ordinance rates: USD per stated units. JPY itself appears as `(156 JPY) につき 1 米ドル`. The adapter keeps these in `usd` fields so that `rate` always means JPY in this package.

## Value formats

- The reporting HTML pages write `(118 JPY)` through 2016-03 and `(115JPY)`, without a space, from 2016-04 to 2016-08; the parser accepts both.
- A listed currency can have a dash instead of a rate: MMK in 2021-05 appears as `1ミャンマー・チャットにつき─米ドル` on the basic page and `─` in the reporting workbook. The adapter keeps such rows with `usd: null` instead of dropping them.
- A sweep on 2026-11-07 parsed every month from 2016-01 to 2026-11 for both datasets: 131 basic pages (55 reference rows each, 54 in 2021-05 before the dash fix) and 131 reporting publications (62 entries), with no unmapped currency names.

- Numbers are parsed as plain decimals (`\d+(?:\.\d+)?`). A list item shaped like a rate (`…につき…米ドル`) that does not parse throws, so a malformed value such as `0..0800` cannot become `NaN` and then serialize as `null`, which would look like a published dash. A sweep on 2026-11-07 parsed all 262 publications (2016-01 to 2026-11) with these rules.
- The CLI table also lists currency names the package cannot map to a code, with their USD quote, so they are not hidden. The sweep found no such names.

## Derived JPY rates

Each announcement defines other currencies as `当該通貨のアメリカ合衆国通貨に対する市場実勢を基準外国為替相場をもって裁定した相場` (for example [kiju2611.htm](https://www.boj.or.jp/about/services/tame/tame_rate/kijun/kiju2611.htm)). `arbitrated` computes `usd × basic` with `multiplyDecimals`, which removes floating-point noise without rounding (see [numeric-precision.md](../jpy-rates/numeric-precision.md)); the BOJ states no rounding. Examples for 2026-11: KRW 11.4816 JPY per 100, VES 0.19032 JPY per 1.

## Currency codes

The basic page names currencies in Japanese without ISO codes; [`src/boj/currency-names.ts`](../../src/boj/currency-names.ts) maps them, and an unknown name yields `code: null` rather than being dropped. The reporting publications include codes.

Venezuela keeps the name ベネズエラ・ボリーバル (with a `(注)` variant in 2018-10), while the BOJ's reporting files label it `VEB` through 2018-09 and `VES` from 2018-10. The adapter follows the BOJ's labels by publication month, not ISO history (where VEF preceded VES).
