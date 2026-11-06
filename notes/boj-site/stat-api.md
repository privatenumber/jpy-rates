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
- The current month's monthly series is listed with `null` until the month ends. The real effective index lags the nominal one by about a month.
- Errors are HTTP 400 with a gzip body and `Content-Encoding: gzip`. fetch decodes it to JSON such as `{"STATUS":400,"MESSAGEID":"M181013E","MESSAGE":"Nonexistent series code：1"}`; raw `curl` output looks binary.

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

A sweep on 2026-11-07 over 1998-01, 1999-01, 2000-02, 2008-10, 2011-03, 2016-06, 2020-03, and 2024-12 found:

- From 1999, the mean of the daily central rates equals FXERM09 to two decimals in every sampled month.
- FXERM06 (month-end 17:00) equals the last trading day's FXERD04 in every sampled month.
- 1998 months have only the 17:00 daily rate; 1973 to 1992-07 months have only the 17:00 monthly series.
