# MURC FX source behavior

Last verified 2026-11-06 against the live site, with Node 24 `fetch` and `redirect: 'manual'` (the same settings as [`src/utils/fetch-source.ts`](../../src/utils/fetch-source.ts)). The snippets below use the package's own `fetchSource` from the repository root, for example `node -e 'const { fetchSource } = await import("./src/utils/fetch-source.ts"); ...'`.

## Dates without data redirect with HTTP 302

The site does not return 404 for a date without rates. It returns 302 to a fixed page, and that page does not distinguish weekends, holidays, unpublished dates, and out-of-range dates.

| Request | Status | `Location` |
| --- | --- | --- |
| `past_3month_result.php?y=2025&m=1&d=4` (Saturday) | 302 | `past_3month.php?caution=1` |
| `past_3month_result.php?y=1989&m=12&d=28` (before 1990) | 302 | `past_3month.php?caution=1` |
| `past_3month_result.php?y=2099&m=1&d=6` (future) | 302 | `past_3month.php?caution=1` |
| `past/index.php?id=250105` (Sunday) | 302 | `../index.php` |
| `past/index.php?id=050801` | 302 | `../index.php` |
| `monthend/index.php?id=2513` (month 13) | 302 | `../index.php` |
| `monthend/index.php?id=0508` | 302 | `../index.php` |
| `yearend/index.php?id=2026` (year not finished) | 302 | `../index.php` |

Project consequences:

- `fetchShiftJisHtml` ([`src/murc/fetch-source.ts`](../../src/murc/fetch-source.ts)) treats a redirect as "no data" only when the `Location` path is `/fx/index.php` or `/fx/past_3month.php`; any other redirect throws. Without this check, a maintenance redirect looked like a holiday, and the walkback silently returned an older day's rates.
- Because out-of-range dates look like holidays, the library checks the range locally (`assertDateInRange` in [`src/utils/date.ts`](../../src/utils/date.ts)) instead of walking back 14 days and reporting "non-business day".

## Availability boundaries

| Endpoint | First available | Evidence |
| --- | --- | --- |
| `past_3month_result.php` (daily TTS/TTB/TTM) | 1990 | Site archive starts in 1990; `1989-12-28` redirects |
| `past/index.php` (daily with cash rates) | 2005-09-01 | `id=050801` redirects, `id=050901` returns 200 |
| `monthend/index.php` | 2005-09 | `id=0508` redirects, `id=0509` returns 200 |
| `yearend/index.php` | 2003 | Existing project behavior; not re-verified in this audit |

## Two-digit year page IDs alias across centuries

`past/index.php?id=YYMMDD` and `monthend/index.php?id=YYMM` use two-digit years, so `1925-01-06` and `2025-01-06` request the same URL. The daily pages contain the date in a heading (`2025年1月6日` appeared three times on `id=250106`), so `fetchDaily` compares the heading with the requested date. `fetchMonthly` relies on the range check because the month-end page date was not used for verification.

## The past-date endpoint has malformed rows

`past_3month_result.php` omits most `<tr>` opening tags, so the parser groups `<td>` cells in sixes instead of reading rows (comment in [`src/murc/fetch-rates.ts`](../../src/murc/fetch-rates.ts)).

With linkedom, `document.body` of a fragment without `<html><body>` is an empty synthetic element; `document.documentElement.textContent` holds the text. The daily heading parser uses `documentElement` for this reason.

## Value cell formats

Main rate tables use plain decimals or `unquoted`. Genuine `unquoted` values appear in real data, for example MXN TTB/TTM and PHP on 1995-01-05, and CNY on 2005-09-01.

The local market tables on `monthend/index.php` (`table.data-table7` after the first) use more formats. Observed on `id=2501` and `id=1001`:

| Format | Example | Meaning |
| --- | --- | --- |
| Comma-grouped thousands | `9,720` (IDR, 2010-01) | One number; `Number.parseFloat` reads it as `9` |
| Quote-date prefix | `(1/24)32.83` (TWD, 2025-01) | Quote dated January 24 |
| Merged cell | `<td colspan="2">` with `(1/27)7.1698` (CNY) | One central or market rate, not separate selling and buying |
| Annotated value | IRR `10,032` followed by a transaction-limit note (2010-01) | Not a plain rate |
| Two values in one cell | VEF (2010-01) | A two-tier rate |

`parseRate` accepts only plain or comma-grouped numbers, so annotated cells become `null`. Merged cells go to `LocalMarketRate.rate`. Prefixes go to `quoteDate`; a prefix month later than the page month belongs to the previous year.

## Workbook labels

**Yearly archive** (`xls/murc_<year>.xls`, sheet `data`): row 0 names each currency with its code in parentheses. Row 1 contains the note `100通貨単位につき` in the column of each currency quoted per 100 units. Observed: IDR and KRW in 2024; BEF, ITL, ESP, IDR, and KRW in 1995 and 2001. `parseArchiveWorkbook` reads `unit` from this note.

**Reference workbooks** (`ref_rate/a_<year>.xls`, `ref_rate/b_<year>.xls`, sheets `1月` to `12月`): row 1 names the sources, row 2 gives each column's quote basis, and row 3 gives TTS/TTB headers. The basis row was identical in `a_2006`, `a_2015`, and `a_2024`, and in `b_2009` and `b_2024`:

| Column | Basis label | Meaning |
| --- | --- | --- |
| CNY per JPY (column 3) | `PER \100` | CNY per 100 JPY (the backslash is the yen sign in Shift_JIS) |
| TWD per JPY (column 6) | `PER YEN` | TWD per 1 JPY |
| MYR per JPY (column 10) | `PER \100` | MYR per 100 JPY |
| All group B columns | `PER US$` | Per 1 USD |

Example row from `a_2024`, January 3: CNY 5.008 per 100 JPY, TWD 0.2196 per JPY, MYR 3.314 per 100 JPY. `fetchReference` reports this as `perJpyUnit`.

**Monthly summary sheets**: 1990-2000 workbooks have an `average` sheet with monthly averages only; there are no monthly highs or lows to report.

**Excel serial dates**: converting with a local-time 1900 epoch shifts dates by one day in zones whose 1900 offset differs from today's, for example `Asia/Shanghai` (1900 LMT +08:05:43) and `Pacific/Apia`. The project converts in UTC; see the `excelDateToIso` test in [`tests/murc/utils.ts`](../../tests/murc/utils.ts).

## Final quotes

The MURC current-rates page states that its figures follow MUFG Bank's final published quote of the day (`最終公表相場による`, observed on `fx/index.php` on 2026-11-06). This matters on days when a bank suspends and republishes its quote after a large move (公表停止・第二公示相場): rules such as [財産評価基本通達4-3](https://www.nta.go.jp/law/tsutatsu/kihon/sisan/hyoka_new/01/01.htm) ask for the final quote. Evidence gap: whether historical archive pages show the final quote on re-quote days was not tested against a known re-quote date.

For comparison, Mizuho's historical CSV states `収録したデータはすべて初回公示分です` (first quotes only), and Mizuho publishes second quotes as a separate dataset ([Mizuho historical data](https://www.mizuhobank.co.jp/market/historical/index.html), accessed 2026-11-06).

## Published corrections

The archive page `fx/past_3month.php` (accessed 2026-11-06) announces that some historical values since 1990 were wrong and were reposted on 2024-04-19, with an errata PDF. Cached copies made before that date can contain wrong values. The package fetches at request time and does not cache.

## Consistency between daily endpoints

`fetchRates` (published TTM) and `fetchDaily` (TTM computed as `(TTS + TTB) / 2`, rounded to 0.01) returned identical TTM and unit values for all 31 currencies on 2025-01-06.
