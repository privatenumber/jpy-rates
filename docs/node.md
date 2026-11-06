# Node.js API

jpy-rates is an ESM package for Node.js 22.22.2 or later. Each source has its own entry point, so you only load what you use:

| Entry point | Provides |
| --- | --- |
| [`jpy-rates`](#guide-jpy-rates) | The rate guide: which rate a rule requires, with rule excerpts, plus the source list |
| [`jpy-rates/murc`](#murc-jpy-ratesmurc) | MUFG Bank customer rates published by MURC |
| [`jpy-rates/customs`](#japan-customs-jpy-ratescustoms) | Japan Customs weekly rates for customs valuation |
| [`jpy-rates/boj`](#bank-of-japan-jpy-ratesboj) | Bank of Japan rates for Foreign Exchange Act reports |

## Common behavior

- **Dates:** pass a `'YYYY-MM-DD'` string, or a `Date` at local midnight (`new Date(2025, 0, 6)`) or UTC midnight (`new Date('2025-01-06')`). Other `Date` values, such as `new Date()`, throw because their calendar date is ambiguous.
- **Ranges:** requests outside the source's available range, or in the future in Japan time, throw a `RangeError` without making a request. Functions return `null` when the source has no data for an in-range request.
- **Unexpected responses:** unexpected redirects and pages without the expected rate table throw instead of being treated as holidays.
- **Cancellation:** every function that fetches accepts an optional last argument `{ signal }` with an `AbortSignal`. Aborting stops retries and business-day walkback.
- **Sources and attribution:** every result includes a `source` URL for the page or file it was parsed from. Customs and BOJ results also include an `attribution` string to show when you publish the data.

## Guide (`jpy-rates`)

The guide encodes which rate Japanese tax and reporting rules require. Each topic has the rate type, the date rule, whose rate the rule asks for, exact excerpts of the rule text with links, notes, and the CLI command that fetches the rate.

```ts
import { getGuideTopic, guideTopics, rateSources } from 'jpy-rates'

const topic = getGuideTopic('stock-sale')
// {
//   id: 'stock-sale',
//   title: 'Foreign stock sale proceeds',
//   titleJa: '外国株式の譲渡対価',
//   source: 'murc',
//   rate: 'TTB',
//   date: 'Trade date (約定日)',
//   institution: 'The paying broker if it publishes a TTB, otherwise its main bank',
//   rules: [{ name: '措置法通達37の10・37の11共-6', url: 'https://www.nta.go.jp/...', excerpts: ['約定日における...'] }],
//   notes: [...],
//   command: 'jpy-rates murc convert ... -d <trade-date> -p stock-sale',
// }
```

- `guideTopics` lists every topic: `general`, `stock-option`, `stock-sale`, `stock-acquisition`, `dividend`, `inheritance-asset`, `inheritance-debt`, `foreign-asset-report`, `import`, `foreign-exchange-report`.
- `getGuideTopic(id)` returns one topic, or `undefined`.
- `rateSources` lists the sources with what they provide, coverage, terms of use, and the attribution to show.

## MURC (`jpy-rates/murc`)

MUFG Bank's customer rates, published by MURC. Rate values (`tts`, `ttb`, `ttm`) are `number | null`; `null` means the source doesn't publish that rate for the currency. Main MUFG rate entries include `unit`: `1` for most currencies and `100` when the source quotes rates per 100 currency units.

```ts
import { fetchRates } from 'jpy-rates/murc'

const result = await fetchRates('2025-01-06')
result?.rates.USD
// Illustrative values:
// { name: 'US Dollar', nameJa: '米ドル', unit: 1, tts: 105.00, ttb: 103.00, ttm: 104.00 }
```

Weekends and Japanese bank holidays resolve to the nearest preceding business day:

```ts
const result = await fetchRates('2025-01-04') // Saturday
result?.date // '2024-12-30', the last business day
```

### Rate types

Japanese banks publish three rates per currency pair:

| Rate | Meaning | Common context |
| --- | --- | --- |
| **TTS** | Bank sells foreign currency to you | You're buying foreign currency with JPY |
| **TTB** | Bank buys foreign currency from you | You're selling foreign currency for JPY |
| **TTM** | Midpoint: (TTS + TTB) / 2 | General reference midpoint |

Tax rules specify different rate types for different purposes, such as TTB for stock sale proceeds. Use `getGuideTopic()` or the `purpose` option of `convertCurrency` to pick the right one.

### Conversion

#### convertCurrency(options)

Converts between JPY and one foreign currency using daily TTS/TTB/TTM rates. Defaults to `ttm`.

- `amount`: `number`
- `from`: currency code, e.g. `'USD'` or `'JPY'`
- `to`: currency code, e.g. `'JPY'` or `'USD'`
- `date`: `string` (`'YYYY-MM-DD'`) or `Date`
- `rate`: `'tts' | 'ttb' | 'ttm'` (optional, defaults to `'ttm'`)
- `purpose`: selects the rate type a tax rule specifies, instead of `rate` (optional): `'general' | 'stock-sale' | 'stock-acquisition' | 'dividend' | 'inheritance-asset' | 'inheritance-debt' | 'foreign-asset-report'`. Throws if combined with `rate`
- `signal`: `AbortSignal` (optional)

The result includes both the requested date and the source business date actually used. Converted amounts are not rounded to yen or cents; they are normalized to 12 significant digits to remove floating-point noise (so `100 × 157.73` is `15773`, not `15772.999999999998`).

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

- `date`: `string` (`'YYYY-MM-DD'`) or `Date` (see [Common behavior](#common-behavior))

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

- `date`: `string` or `Date` (optional, defaults to today)

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
//       },  // no perJpy: group B currencies only have perUsd
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
import { downloadArchiveSource, getArchiveSourceUrl, parseArchiveWorkbook } from 'jpy-rates/murc'

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

## Japan Customs (`jpy-rates/customs`)

Weekly rates for converting the customs value of imports, announced by the Director-General of Customs. A rate applies to import declarations made during its week. It is based on the average market rate of the week before last (関税定率法4条の7). Weekly files are available from 2008.

```ts
import { fetchCustomsRates } from 'jpy-rates/customs'

const result = await fetchCustomsRates('2026-11-06')
// {
//   source: 'https://www.customs.go.jp/tetsuzuki/kawase/kawase2026/kouji-rate20261101-20261107.pdf',
//   attribution: '出典：税関ウェブサイト（...）、PDL1.0（...）',
//   period: { start: '2026-11-01', end: '2026-11-07' },
//   rates: {
//     USD: {
//       code: 'USD', countries: ['アメリカ合衆国'], currencyJa: 'ドル',
//       unit: 1, rate: 150.00, equivalentTo: null,
//     },
//     KRW: { code: 'KRW', ..., unit: 100, rate: 11.00 },  ← JPY per 100 KRW
//     BND: { code: 'BND', ..., rate: 120.00, equivalentTo: 'SGD' },  ← value copied from SGD
//     ...
//   }
// }
```

- `rate` is JPY per `unit` currency units (1 or 100).
- `countries` are the labels as published, such as `グレナダ他`.
- `equivalentTo` marks a currency that the source publishes as equal to another one; its value is derived from that currency's row.
- Returns `null` when no published week covers the date yet (Customs announces rates about a week ahead). Throws a `RangeError` before the first available week.
- PDF parsing uses [`pdfjs-dist`](https://www.npmjs.com/package/pdfjs-dist), loaded only when this entry point fetches rates.

## Bank of Japan (`jpy-rates/boj`)

Monthly conversion rates for reports under the Foreign Exchange Act (外為法), set by the Minister of Finance and announced by the Bank of Japan. Available from 2016-01.

```ts
import { fetchBasicRates, fetchReportingRates } from 'jpy-rates/boj'

const basic = await fetchBasicRates(2026, 11)
// {
//   month: '2026-11',
//   basic: 150,                         ← JPY per 1 USD (基準外国為替相場)
//   cross: { EUR: 170, GBP: 200, ... },  ← JPY per 1 unit, as published (裁定外国為替相場)
//   referenceMonth: '2026-09',
//   reference: [{ code: 'KRW', nameJa: '韓国ウォン', unit: 100, usd: 0.07 }, ...],
//   arbitrated: { KRW: { unit: 100, rate: 10.5 }, ... },  ← derived: usd × basic
//   source, attribution,
// }

const reporting = await fetchReportingRates(2026, 11)
// {
//   month: '2026-11',
//   rates: {
//     EUR: { code: 'EUR', unit: 1, usd: 1.10 },
//     JPY: { code: 'JPY', unit: 150, usd: 1 },
//     ...
//   },
//   source, attribution,
// }
```

- `cross` lists the six currencies the announcement prices in yen.
- For other currencies, the announcement states the rate is the USD market rate (`reference`) arbitraged through the basic rate. `arbitrated` computes that as `usd × basic`. It is derived by this package, and the BOJ states no rounding.
- `reporting` rates are quoted in USD (`usd` per `unit` units), for reports that state amounts in USD.
- `reference[].code` is `null` for a currency name this package does not recognize, so new currencies are not dropped.
- `usd` is `null` when the BOJ lists a currency with a dash instead of a rate (for example MMK in 2021-05). Such currencies stay in `reference` and `rates` but have no `arbitrated` entry.
- Both functions return `null` for a month that is not announced yet (announcements come out around the 20th of the previous month).
