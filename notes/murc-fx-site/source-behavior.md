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

- `fetchShiftJisHtml` ([`src/murc/fetch-source.ts`](../../src/murc/fetch-source.ts)) treats a redirect as "no data" only when the `Location` resolves to the same origin and its path is `/fx/index.php` or `/fx/past_3month.php`; any other redirect throws. The origin check was added on 2026-11-07 after a code review showed a redirect to another host's `/fx/index.php` passed as a holiday. Without this check, a maintenance redirect looked like a holiday, and the walkback silently returned an older day's rates.
- Today's rates are not published until after about 11:00 JST. The today page says `相場は11時過ぎに変更します（Table will be updated around 11：00）`, and before the update it shows today's date with `-` in every rate cell (seen in a search-engine copy of `/fx/` for 2026-11-04). MUFG Bank sets its central rate (仲値) at about 9:55 JST. A request for today before the update gets the same redirect as a holiday. [`src/murc/business-day.ts`](../../src/murc/business-day.ts) therefore walks back from today only on a weekend; a weekday today without rates throws "not published yet". Reasons:
  - 所得税基本通達57の3-2 注3 allows the nearest earlier rate only when the date has no rate. A weekday before 11:00 has a rate that is not published yet, so the previous day's rate is not the rule's fallback.
  - Precedent: the Ruby client [matsubo/ttsttb](https://github.com/matsubo/ttsttb/blob/master/lib/ttsttb.rb) refuses today entirely (`raise 'Today is not supported yet.' if date == Date.today`).
  - Rejected: a holiday calendar (a dependency or a data download, and bank holidays such as 12/31 and 1/2-1/3 are not national holidays) and a time-of-day cutoff (the 11:00 update time is approximate). A weekday holiday today gets an error that tells the user to pass the previous business day, which is safer for tax filing than a silent substitution.
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

## World and local market quote basis

- World rates (`world.html` and `worlddata/<region>.csv`): the page notes say `基準相場および為替相場各欄は、特記なき限り対米ドル相場（1米ドルにつき各通貨単位）` and `Rates in 'Quotations by Monetary Authorities' and 'Market Levels' columns are against the US dollar (each currency for US$1) rates, unless otherwise indicated`. So the CSV `quotations` column is the official rate (often a peg such as `B$ 1=S$ 1`, or a number such as `2.7` for EC$), not a quote direction. On 2026-11-07, 104 of 122 rows had an empty `quotations` field. The CSV header row spells the first column `countory` in four regions and `country` in `mideast`; `parseCsv` validates the six other column names.
- Monthly local market rates (`monthend/index.php`): the table is headed `諸通貨の現地における相場 Rates against the US dollar quoted in other markets`, so the CLI labels them per 1 USD. The 2026-10 page also showed a PHP warning (`require_once(inc/2610.html): Failed to open stream`) inside that section on 2026-11-07.

## Rate invariants

MURC states `公表仲値（TTM）は、TTSとTTBの中間の相場であり、（TTS＋TTB）/2で算出されます` on the today page. On 2026-11-07, 486 daily rows with all three rates, sampled on 16 dates from 1990 to 2026, all had TTM within 0.005 of (TTS + TTB) / 2. `fetchRates` ([`src/murc/fetch-rates.ts`](../../src/murc/fetch-rates.ts)) throws when a row breaks this or when the cell count is not a multiple of 6, so a shifted or added column cannot be read silently as other rates. A sweep of 74 dates (two per year, 1990 to 2026) passed both checks.

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

**Monthly summary sheets**: 1990-2000 workbooks have an `average` sheet with monthly averages only; there are no monthly highs or lows to report. From 2001 the `月毎`/`月毎HLA` sheet labels each month, and 2001-2009 workbooks use a full-width `２月` for February (observed in 2001-2006 and 2008; 2007 and 2009 use `2月`). Without NFKC normalization, February's summary was reported as month 1.

**Unquoted months are 0**: summary sheets store `0` where MURC has no quote, for example MYR (unquoted at MURC) in every month from 2010-10 and CNY in early 2010, sometimes for the average only. Before 2026-11-07 the parser emitted an all-zero MYR summary for February 2011 to 2025. `extractRowValues` ([`src/murc/archive.ts`](../../src/murc/archive.ts)) now treats non-positive values as missing, and each of high, low, and average is kept on its own (a missing one is `null`). A sweep of every archive from 1990 to 2025 afterwards found no 0 values and no partial summaries; the 134,007 daily rate fields in six sampled archives had no 0 values.

**Excel serial dates**: converting with a local-time 1900 epoch shifts dates by one day in zones whose 1900 offset differs from today's, for example `Asia/Shanghai` (1900 LMT +08:05:43) and `Pacific/Apia`. The project converts in UTC; see the `excelDateToIso` test in [`tests/murc/utils.ts`](../../tests/murc/utils.ts).

## Final quotes

The MURC current-rates page states that its figures follow MUFG Bank's final published quote of the day (`最終公表相場による`, observed on `fx/index.php` on 2026-11-06). This matters on days when a bank suspends and republishes its quote after a large move (公表停止・第二公示相場): rules such as [財産評価基本通達4-3](https://www.nta.go.jp/law/tsutatsu/kihon/sisan/hyoka_new/01/01.htm) ask for the final quote. Evidence gap: whether historical archive pages show the final quote on re-quote days was not tested against a known re-quote date.

For comparison, Mizuho's historical CSV states `収録したデータはすべて初回公示分です` (first quotes only), and Mizuho publishes second quotes as a separate dataset ([Mizuho historical data](https://www.mizuhobank.co.jp/market/historical/index.html), accessed 2026-11-06).

## Published corrections

The archive page `fx/past_3month.php` (accessed 2026-11-06) announces that some historical values since 1990 were wrong and were reposted on 2024-04-19, with an errata PDF. Cached copies made before that date can contain wrong values. The package fetches at request time and does not cache.

## Consistency between daily endpoints

`fetchRates` (published TTM) and `fetchDaily` (TTM computed as `(TTS + TTB) / 2`, rounded to 0.01) returned identical TTM and unit values for all 31 currencies on 2025-01-06.
