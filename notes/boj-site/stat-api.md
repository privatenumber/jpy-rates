# BOJ Time-Series Data Search API behavior

Observed on 2026-11-07 against `https://www.stat-search.boj.or.jp/api/v1/getDataCode`, which [`src/boj/stat-api.ts`](../../src/boj/stat-api.ts) calls. Terms are in [source-terms.md](../jpy-rates/source-terms.md#boj-time-series-api).

## Requests

- No API key. Parameters: `format=json`, `lang=en|jp`, `db`, `code` (comma-separated), `startDate`, `endDate`.
- Periods are `YYYYMM` for both daily and monthly series. `YYYYMMDD` and `YYYY` return `M181015E Invalid frequency (start period)`.
- All codes in one request must share a frequency. Mixing daily and monthly codes returns `M181014E Frequency not matching`.
- `lang=en` adds a `UNIT` field per series, such as `Yen per U.S. Dollar` or `CY 2020=100`. The package reads the effective index base from it.

## Responses

- Success is `STATUS: 200`, `MESSAGEID: M181000I`.
- A period with no data, such as a future month, is still HTTP 200, with `MESSAGEID: M181030I` and every value `null`.
- A daily series lists every calendar day of the month. Weekends, holidays, and unpublished days have `null` values. The package keeps only days with at least one value.
- The current month's monthly series is listed with `null` until the month ends. On 2026-11-07 both effective indices ended at 2026-09; the package does not assume either is published first.
- Errors are HTTP 400 with a gzip body and `Content-Encoding: gzip`. fetch decodes it to JSON such as `{"STATUS":400,"MESSAGEID":"M181013E","MESSAGE":"Nonexistent series code：1"}`; raw `curl` output looks binary.

## Client behavior

- A caller abort while the response body is read rejects with the caller's reason, not "unreadable response" ([`src/boj/stat-api.ts`](../../src/boj/stat-api.ts)).
- Month bounds are compared as numbers. As strings, year 99 (`99-01`) sorted after `1998-01` and sent a request with `startDate=9901`.

## Series used

| Code | Frequency | Starts | Meaning |
| --- | --- | --- | --- |
| FXERD01 | daily | 1999-01 | USD/JPY spot at 9:00, Tokyo market |
| FXERD02 / FXERD03 | daily | 1999-01 | Daily high / low |
| FXERD04 | daily | 1998-01-05 | Spot at 17:00 |
| FXERD05 | daily | 1999-01 | Central rate (中心相場) |
| FXERM06 / FXERM07 | monthly | 1973-01 | 17:00 rate, month-end / monthly average |
| FXERM08 / FXERM09 | monthly | 1992-08 | Central rate, month-end / monthly average |
| FXERM03 / FXERM05 | monthly | 1992-08 | Monthly high / low |
| FX180110001 / FX180110002 | monthly | 1970-01 | Nominal / real effective exchange rate index (CY 2020=100) |

Not used: volumes (FXERD06/07), the yen index (FXERD39), EUR/USD (FXERD31-36), and series marked 更新停止.

## Consistency checks

A full sweep on 2026-11-07 fetched all daily series for 1998-01 to 2026-11 (one request per year), all monthly series for 1973-01 to 2026-12, and both effective indices for 1970-01 to 2026-12 in one request each. Multi-month ranges were used only for this sweep, to keep the request count low; the package requests one month at a time. Results:

- 7,067 trading days, none on a weekend, all between 50 and 400 JPY, none with high below low.
- 1998 has only the 17:00 daily rate (247 days); every day from 1999 has all five daily series.
- For every month from 1999-01 to 2026-10, FXERM07 and FXERM09 equal the mean of the daily 17:00 and central rates within 0.005, and FXERM06, FXERM08, FXERM03, and FXERM05 equal the last day's 17:00 and central rates and the daily maximum and minimum exactly.
- The 1998 monthly central rate exists (from 1992-08) without a daily central rate.
- Source quirk: on 16 days, the 9:00 or 17:00 rate is 0.01 above the day's published high (for example 2002-08-14: 9:00 118.37, high 118.36). The package reports values as published and does not assume the spot rates lie within the high and low.
- The effective indices have 684 months, CY 2020=100 for both, with no gaps before 2026-10.
- `fetchEffectiveRates` and the market functions matched the bulk data in every sampled month.
