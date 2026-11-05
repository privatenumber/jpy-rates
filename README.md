# murc-rates

Unofficial TypeScript client and CLI for exchange-rate data published by [MURC](https://www.murc-kawasesouba.jp/fx/index.php). Access [MUFG Bank](https://www.bk.mufg.jp/) daily and historical rates, cash rates, monthly and yearly summaries, and extended reference data quoted against JPY and USD. Daily TTS/TTB/TTM data covers 31 currencies back to 1990. Useful for currency conversion and tax-related recordkeeping workflows that need source-linked rates.

> [!NOTE]
> This is an unofficial package, not affiliated with or endorsed by MUFG Bank, MURC, or the National Tax Agency. It fetches publicly available data from the [MURC FX pages](https://www.murc-kawasesouba.jp/fx/index.php). It is not tax, accounting, legal, investment, trading, or settlement advice.

## Install

```bash
pnpm add murc-rates
```

## Quick Start

```ts
import { fetchRates } from 'murc-rates'

const result = await fetchRates('2025-01-06')

if (result) {
    console.log(result.rates.USD)
    // Example shape with illustrative values:
    // {
    //   name: 'US Dollar',
    //   unit: 1,
    //   tts: 105.00,  ← bank sells USD to you at this rate
    //   ttb: 103.00,  ← bank buys USD from you at this rate
    //   ttm: 104.00   ← midpoint published as TTM
    // }
}
```

Weekends and Japanese bank holidays automatically resolve to the nearest preceding business day:

```ts
const result = await fetchRates('2025-01-04') // Saturday
result?.date // '2024-12-30' — last business day
```

## Rate Types

Japanese banks publish three rates per currency pair:

| Rate | Meaning | Common context |
| --- | --- | --- |
| **TTS** | Bank sells foreign currency to you | You're buying foreign currency with JPY |
| **TTB** | Bank buys foreign currency from you | You're selling foreign currency for JPY |
| **TTM** | Midpoint: (TTS + TTB) / 2 | General reference midpoint; see [NTA context](#tax-related-context) for tax-related source links |

For tax-related workflows, verify the current official NTA sources and your own facts. See [Tax-Related Context](#tax-related-context) for source links and caveats.

## CLI

```bash
murc-rates rates 2025-01-06               # daily rates for a date
murc-rates rates 2025-01-06 -c USD        # filter to one currency
murc-rates convert -a 100 -f USD -t JPY -d 2025-01-06
murc-rates daily                         # today's rates + cash rates
murc-rates monthly 2025 1                # month-end + monthly average
murc-rates yearly 2024                   # year-end + yearly average
murc-rates world                         # 120+ countries vs USD
murc-rates reference 2024                # TWD, BRL, etc. from local branches
murc-rates download-source 2024 -o murc_2024.xls   # add --force to overwrite
murc-rates parse-archive murc_2024.xls --json
```

Output is human-readable tables by default. Add `--json` for machine-readable JSON. Colors are disabled when piped or when `NO_COLOR` is set. Currencies quoted per 100 units are marked with `*`. `--currency` is case-insensitive, and unknown flags are rejected.

Conversions accept negative amounts, for example `murc-rates convert -a -100 -f USD -t JPY -d 2025-01-06`.

## API

Every result includes a `source` URL pointing to the page or file the data was parsed from. Rate values (`tts`, `ttb`, `ttm`) are `number | null` — `null` when the source doesn't publish that rate for a given currency. Main MUFG rate entries include `unit`: `1` for most currencies and `100` when the source quotes rates per 100 currency units.

### Common behavior

- **Dates:** pass a `'YYYY-MM-DD'` string, or a `Date` at local midnight (`new Date(2025, 0, 6)`) or UTC midnight (`new Date('2025-01-06')`). Other `Date` values, such as `new Date()`, throw because their calendar date is ambiguous.
- **Ranges:** requests outside the source's available range, or in the future in Japan time, throw a `RangeError` without making a request. Functions return `null` when the source has no data for an in-range request.
- **Unexpected responses:** unexpected redirects and pages without the expected rate table throw instead of being treated as holidays.
- **Cancellation:** every function that fetches accepts an optional last argument `{ signal }` with an `AbortSignal`. Aborting stops retries and business-day walkback.

### Conversion

#### convertCurrency(options)

Converts between JPY and one foreign currency using daily TTS/TTB/TTM rates. Defaults to `ttm`.

- `amount` — `number`
- `from` — currency code, e.g. `'USD'` or `'JPY'`
- `to` — currency code, e.g. `'JPY'` or `'USD'`
- `date` — `string` (`'YYYY-MM-DD'`) or `Date`
- `rate` — `'tts' | 'ttb' | 'ttm'` (optional, defaults to `'ttm'`)
- `signal` — `AbortSignal` (optional)

The result includes both the requested date and the source business date actually used. Converted amounts are not rounded.

```ts
const result = await convertCurrency({
    amount: 100,
    from: 'USD',
    to: 'JPY',
    date: '2025-01-06',
    rate: 'ttm'
})
// {
//   source: 'https://www.murc-kawasesouba.jp/fx/...',
//   requestedDate: '2025-01-06',
//   sourceDate: '2025-01-06',
//   amount: 100,
//   from: 'USD',
//   to: 'JPY',
//   rate: 'ttm',
//   rateValue: 104.00,
//   unit: 1,
//   convertedAmount: 10400,
// }
```

#### convertWithRates(ratesResult, options)

Converts with an already-fetched `fetchRates()` result, without another request. Use it to convert many amounts with one quote. It takes the same `amount`, `from`, `to`, and `rate` options and returns the same result without `requestedDate`.

```ts
const rates = await fetchRates('2025-01-06')
if (rates) {
    const result = convertWithRates(rates, {
        amount: 100,
        from: 'USD',
        to: 'JPY'
    })
}
```

### Daily rates

#### fetchRates(date)

TTS/TTB/TTM for all currencies on a specific date. Available from 1990. The primary function for most use cases.

- `date` — `string` (`'YYYY-MM-DD'`) or `Date` (see [Common behavior](#common-behavior))

Returns `null` if no data is found. Rates are keyed by [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217) (e.g. `USD`, `EUR`, `GBP`).

```ts
const result = await fetchRates('2025-01-06')
// {
//   source: 'https://www.murc-kawasesouba.jp/fx/...',
//   date: '2025-01-06',
//   rates: {
//     USD: { name: 'US Dollar', nameJa: '...', unit: 1, tts: 105.00, ttb: 103.00, ttm: 104.00 },
//     EUR: { name: 'Euro', nameJa: '...', unit: 1, tts: 205.00, ttb: 203.00, ttm: 204.00 },
//     ...
//   }
// }
```

#### fetchDaily(date?)

Same rates as `fetchRates` plus **cash selling/buying rates** (physical currency exchange). Defaults to today's published page, and `date` is read from that page. Available from 2005-09-01.

- `date` — `string` or `Date` (optional, defaults to today)

Returns `null` if no data is found.

```ts
const result = await fetchDaily()
// {
//   source: '...',
//   date: '2025-01-06',
//   rates: {
//     USD: { name: '...', nameJa: '...', unit: 1, tts: 105.00, ttb: 103.00, ttm: 104.00 },
//     ...
//   },
//   cashRates: {
//     USD: { selling: 110.00, buying: 100.00 },
//     EUR: { selling: 212.00, buying: 196.00 },
//     ...
//   }
// }
```

### Summaries

#### fetchMonthly(year, month)

Month-end rates and monthly averages. Available from September 2005.

Returns `null` if no data is found. `localMarketRates` lists rates published by local markets and branches. A rate published as one value, such as a central rate, is in `rate`, with `selling` and `buying` set to `null`. `quoteDate` is set when the source annotates the quote with a date. `unit` is `1` for most currencies, `100` for low-value currencies (e.g. KRW, IDR) where rates are quoted per 100 units.

```ts
const result = await fetchMonthly(2025, 1)
// {
//   source: '...',
//   year: 2025,
//   month: 1,
//   rates: {
//     USD: {
//       name: 'US Dollar', nameJa: '米ドル', unit: 1,
//       monthEnd:        { tts: 105.00, ttb: 103.00, ttm: 104.00 },
//       monthlyAverage:  { tts: 104.50, ttb: 102.50, ttm: 103.50 },
//     },
//     ...
//   },
//   localMarketRates: {
//     TWD: { name: 'TWD ...', nameJa: '台湾ドル',
//       selling: 31.50, buying: 31.10, rate: null, quoteDate: '2025-01-24',
//       sourceJa: '...', source: '...' },
//     CNY: { name: 'CNY ...', nameJa: '中国・人民元',
//       selling: null, buying: null, rate: 7.10, quoteDate: '2025-01-27',
//       sourceJa: '...', source: '...' },
//     ...  ← Asian/Latin American currencies quoted against USD from local branches
//   }
// }
```

#### fetchYearly(year)

Year-end rates and yearly averages. Available from 2003.

Returns `null` if no data is found.

```ts
const result = await fetchYearly(2024)
// {
//   source: '...',
//   year: 2024,
//   rates: {
//     USD: {
//       name: 'US Dollar', nameJa: '米ドル', unit: 1,
//       yearEnd:        { tts: 105.00, ttb: 103.00, ttm: 104.00 },
//       yearlyAverage:  { tts: 104.50, ttb: 102.50, ttm: 103.50 },
//     },
//     ...
//   }
// }
```

### Extended data

#### fetchWorld()

Reference rates for 120+ countries/territories against USD, grouped by region. Updated monthly.

```ts
const result = await fetchWorld()
// {
//   source: '...',
//   date: '2026-05-15',
//   asia: [
//     {
//       country: 'China', countryJa: '中国',
//       currency: 'Yuan Renminbi', code: 'CNY',
//       quotation: 'per USD', marketLevel: '7.5000', remarks: '',
//     },
//     ...
//   ],
//   africa: [...],
//   europe: [...],
//   mideast: [...],
//   americas: [...],
// }
```

#### fetchReference(year)

Daily rates from local MUFG branches for currencies not in the main 31: `CNY`, `TWD`, `MYR` (from 2006), `KRW`, `IDR`, `BRL`, `ARS`, `CLP` (from 2009).

Returns `null` if no data is found for the given year. `perJpy` values are foreign currency per `perJpyUnit` JPY: CNY and MYR are quoted per 100 JPY, and TWD per 1 JPY.

```ts
const result = await fetchReference(2024)
// {
//   source: ['https://.../a_2024.xls', 'https://.../b_2024.xls'],
//   year: 2024,
//   currencies: {
//     TWD: {
//       sourceJa: '...',
//       perJpyUnit: 1,
//       rates: {
//         perUsd: [{ date: '2024-01-04', tts: 31.50, ttb: 31.10 }, ...],
//         perJpy: [{ date: '2024-01-04', tts: 0.2250, ttb: 0.2210 }, ...],
//       },
//       monthlySummary: [{ month: 1, high: 31.6, low: 31.1, average: 31.3 }, ...],
//     },
//     KRW: {
//       sourceJa: '...',
//       perJpyUnit: null,
//       rates: {
//         perUsd: [{ date: '2024-01-02', tts: 1000.50, ttb: 999.50 }, ...],
//       },  // no perJpy — Group B currencies only have perUsd
//       monthlySummary: [...],
//     },
//     ...
//   }
// }
```

### Archive source files

MURC publishes yearly XLS archive files. The package keeps source download and parsing as separate steps:

- `getArchiveSourceUrl(year)` returns the official XLS URL.
- `downloadArchiveSource(year)` downloads the untouched XLS bytes.
- `parseArchiveWorkbook(xlsBuffer, { sourceUrl })` parses a workbook the caller provides and infers the year from workbook dates. `source` is the `sourceUrl` you pass, or `null` because the parser cannot know where the bytes came from.

This avoids a combined public download-and-export API. Use the downloaded source files according to the source site's terms.

Encrypted BIFF8 XLS workbooks are supported only when Excel's default password, `VelvetSweatshop`, passes password verification. Supported formats are standard RC4 version `1.1` and RC4 CryptoAPI versions `2.2`, `3.2`, and `4.2` with RC4/SHA-1 and explicit 40-128-bit keys in 8-bit increments. Other passwords, implicit CryptoAPI key sizes, XOR obfuscation, and other encryption formats are unsupported. Password mismatches, unsupported formats, and malformed encryption metadata produce distinct errors. Parsing keeps all transformations in memory and does not modify the input bytes.

```ts
import { downloadArchiveSource, getArchiveSourceUrl, parseArchiveWorkbook } from 'murc-rates'

const xlsBuffer = await downloadArchiveSource(2024)
const result = await parseArchiveWorkbook(xlsBuffer, {
    sourceUrl: getArchiveSourceUrl(2024)
})
// {
//   source: 'https://.../murc_2024.xls',
//   year: 2024,
//   currencies: {
//     USD: {
//       unit: 1,  ← 100 for currencies the workbook quotes per 100 units
//       daily: [
//         { date: '2024-01-04', tts: 105.00, ttb: 103.00, ttm: 104.00 },
//         ...  ← every business day
//       ],
//       monthly: [
//         { month: 1, high: 120.00, low: 110.00, average: 115.00 },
//         ...  ← 12 entries
//       ],
//       annual: { high: 130.00, low: 105.00, average: 118.00 },
//     },
//     // Summary values are null when the workbook does not publish them.
//     // 1990-2000 workbooks publish only monthly averages, so high and low are null.
//     ...
//   }
// }
```

## Tax-Related Context

This package provides source-linked exchange-rate data. It does not determine which rate applies to your filing and is not tax, accounting, or legal advice.

[所得税基本通達 57の3-2](https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm) discusses yen conversion of foreign-currency amounts, including conversion using a principal transaction bank's TTM and stated circumstances where continuous use of TTB/TTS may be permitted. The NTA also publishes [国外財産調書 FAQ](https://www.nta.go.jp/publication/pamph/hotei/kokugai_zaisan/pdf/kokugai_faq_h2_01.pdf) material that discusses foreign-asset reporting and valuation.

Source links commonly relevant to tax-related rate lookup:

- [NTA basic directive 57の3-2](https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm)
- [NTA stock option example](https://www.keisan.nta.go.jp/r7yokuaru/ocat2/ocat21/cid477.html)
- [NTA foreign-asset FAQ PDF](https://www.nta.go.jp/publication/pamph/hotei/kokugai_zaisan/pdf/kokugai_faq_h2_01.pdf)

Always verify calculations against the official source pages and consult a qualified professional for your specific situation.

## Data Source

Rates are published on the [MURC FX pages](https://www.murc-kawasesouba.jp/fx/index.php) (三菱UFJリサーチ＆コンサルティング), labeled as [MUFG Bank](https://www.bk.mufg.jp/) exchange quotations.

MURC's [FX FAQ](https://www.murc-kawasesouba.jp/fx/faq/faq.pdf) describes these pages as foreign-exchange information and notes that displayed rates are reference values. Rate availability, timing, and revisions are controlled by the source site.

## Legal And Source Use

This package is an unofficial software client. It is not affiliated with, authorized by, sponsored by, or endorsed by MUFG Bank, MURC, or the National Tax Agency.

The package fetches public source pages at runtime with an identifying user-agent that points to the npm package page, and returns parsed rate facts with source URLs. It does not grant permission to copy, redistribute, republish, or sell MURC pages, CSV files, XLS files, or other source content. Review and follow the applicable MURC/MUFG terms, including MURC's [site-use terms](https://www.murc.jp/about/), before using this package in public, commercial, cached, or high-volume systems.

Rate data can change, be delayed, or be unavailable. Verify important results against the linked source URLs. Do not use this package as the sole source for tax filing, accounting, legal, investment, trading, settlement, or real-time financial decisions.

<details>
<summary>Comparison with other sources</summary>

| Source | History | Rates | Notes |
| --- | --- | --- | --- |
| [MUFG / MURC](https://www.murc-kawasesouba.jp/fx/past_3month.php) (this package) | Daily quotes since 1990 | TTS / TTB / TTM | Coverage varies by endpoint (yearly from 2003, monthly from 2005-09) |
| [Mizuho Bank](https://www.mizuhobank.co.jp/market/historical/index.html) | Public data from 2002 | CSV/text: middle only; [PDF backnumbers](https://www.mizuhobank.co.jp/market/historical/backnumber_b/index.html) include TTS / TTB / central | Historical page has both middle-rate data files and full quote PDFs |
| [SMBC](https://www.smbc.co.jp/market/backnumber/fixing/past.html) | Monthly | Middle only | USD, CHF, GBP, EUR only |
| [Bank of Japan](https://www.boj.or.jp/en/statistics/market/forex/fxdaily/index.htm) | Since 2007 | Interbank mid | Not customer rates |

</details>

## References

- [MURC foreign exchange main page](https://www.murc-kawasesouba.jp/fx/index.php)
- [MURC FX FAQ PDF](https://www.murc-kawasesouba.jp/fx/faq/faq.pdf)
- [MURC site-use terms](https://www.murc.jp/about/)
- [NTA basic directive 57の3-2](https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm)
- [NTA foreign-asset FAQ PDF](https://www.nta.go.jp/publication/pamph/hotei/kokugai_zaisan/pdf/kokugai_faq_h2_01.pdf)
