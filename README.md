# jpy-rates

Find the JPY exchange rate that a Japanese tax or reporting rule asks for, with the rule text and a source link. A TypeScript library and CLI over three public sources:

| Source | Rates | Used for |
| --- | --- | --- |
| [MURC](https://www.murc-kawasesouba.jp/fx/index.php) | [MUFG Bank](https://www.bk.mufg.jp/) customer TTS/TTB/TTM since 1990, cash rates, monthly and yearly summaries | Income tax, stock sales and dividends, inheritance, 国外財産調書 |
| [Japan Customs](https://www.customs.go.jp/tetsuzuki/kawase/index.htm) | Weekly rates for customs valuation | Imports (customs duty and import consumption tax) |
| [Bank of Japan](https://www.boj.or.jp/about/services/tame/tame_rate/index.htm) | Monthly rates set by the Minister of Finance | Reports under the Foreign Exchange Act (外為法) |

> [!NOTE]
> This is an unofficial package, not affiliated with or endorsed by MUFG Bank, MURC, Japan Customs, the Bank of Japan, or the National Tax Agency. It fetches public data on request. It is not tax, accounting, legal, investment, trading, or settlement advice.

## Install

```bash
pnpm add jpy-rates
```

## Quick start: which rate applies?

Start with the guide. It lists each purpose with the rate type, date rule, and source:

```bash
jpy-rates guide
```

Ask about one purpose to see the governing rule text and the command that fetches the rate:

```bash
jpy-rates guide stock-sale
```

Then fetch the rate:

```bash
jpy-rates murc convert -a 1000 -f USD -t JPY -d 2025-01-06 -p stock-sale
```

`jpy-rates sources` lists each source with its coverage and terms of use. Every command prints human-readable output; add `--json` for machine-readable output.

The guide is also available as data:

```ts
import { getGuideTopic, guideTopics, rateSources } from 'jpy-rates'

getGuideTopic('foreign-asset-report')
// { rate: 'TTB (the final quote of the day)', date: 'December 31; ...', rules: [{ name: '国外送金等調書法通達5-14', url, excerpts }], command, ... }
```

## MURC (`jpy-rates/murc`)

MUFG Bank's customer rates, published by MURC.

```ts
import { fetchRates } from 'jpy-rates/murc'

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

### Rate types

Japanese banks publish three rates per currency pair:

| Rate | Meaning | Common context |
| --- | --- | --- |
| **TTS** | Bank sells foreign currency to you | You're buying foreign currency with JPY |
| **TTB** | Bank buys foreign currency from you | You're selling foreign currency for JPY |
| **TTM** | Midpoint: (TTS + TTB) / 2 | General reference midpoint; see [NTA context](#tax-related-context) for tax-related source links |

Tax rules specify different rate types for different purposes, such as TTB for stock sale proceeds. See [Which rate type a rule specifies](#which-rate-type-a-rule-specifies).

### CLI

```bash
jpy-rates murc rates 2025-01-06               # daily rates for a date
jpy-rates murc rates 2025-01-06 -c USD        # filter to one currency
jpy-rates murc convert -a 100 -f USD -t JPY -d 2025-01-06
jpy-rates murc convert -a 100 -f USD -t JPY -d 2025-01-06 -p stock-sale   # TTB
jpy-rates murc daily                         # today's rates + cash rates
jpy-rates murc monthly 2025 1                # month-end + monthly average
jpy-rates murc yearly 2024                   # year-end + yearly average
jpy-rates murc world                         # 120+ countries vs USD
jpy-rates murc reference 2024                # TWD, BRL, etc. from local branches
jpy-rates murc download-source 2024 -o murc_2024.xls   # add --force to overwrite
jpy-rates murc parse-archive murc_2024.xls --json
```

Output is human-readable tables by default. Add `--json` for machine-readable JSON. Colors are disabled when piped or when `NO_COLOR` is set. Currencies quoted per 100 units are marked with `*`. `--currency` is case-insensitive, and unknown flags are rejected.

Conversions accept negative amounts, for example `jpy-rates murc convert -a -100 -f USD -t JPY -d 2025-01-06`.

### API

Every result includes a `source` URL pointing to the page or file the data was parsed from. Rate values (`tts`, `ttb`, `ttm`) are `number | null` — `null` when the source doesn't publish that rate for a given currency. Main MUFG rate entries include `unit`: `1` for most currencies and `100` when the source quotes rates per 100 currency units.

#### Common behavior

- **Dates:** pass a `'YYYY-MM-DD'` string, or a `Date` at local midnight (`new Date(2025, 0, 6)`) or UTC midnight (`new Date('2025-01-06')`). Other `Date` values, such as `new Date()`, throw because their calendar date is ambiguous.
- **Ranges:** requests outside the source's available range, or in the future in Japan time, throw a `RangeError` without making a request. Functions return `null` when the source has no data for an in-range request.
- **Unexpected responses:** unexpected redirects and pages without the expected rate table throw instead of being treated as holidays.
- **Cancellation:** every function that fetches accepts an optional last argument `{ signal }` with an `AbortSignal`. Aborting stops retries and business-day walkback.

#### Conversion

##### convertCurrency(options)

Converts between JPY and one foreign currency using daily TTS/TTB/TTM rates. Defaults to `ttm`.

- `amount` — `number`
- `from` — currency code, e.g. `'USD'` or `'JPY'`
- `to` — currency code, e.g. `'JPY'` or `'USD'`
- `date` — `string` (`'YYYY-MM-DD'`) or `Date`
- `rate` — `'tts' | 'ttb' | 'ttm'` (optional, defaults to `'ttm'`)
- `purpose` — selects the rate type a tax rule specifies, instead of `rate` (optional; see [Which rate type a rule specifies](#which-rate-type-a-rule-specifies))
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

##### convertWithRates(ratesResult, options)

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

#### Daily rates

##### fetchRates(date)

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

##### fetchDaily(date?)

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

#### Summaries

##### fetchMonthly(year, month)

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

##### fetchYearly(year)

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

#### Extended data

##### fetchWorld()

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

##### fetchReference(year)

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

#### Archive source files

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

## Tax-Related Context

This package provides source-linked exchange-rate data. It is not tax, accounting, or legal advice, and it does not decide which rate applies to your filing. The summary below links to the rules so you can check them; `jpy-rates guide <topic>` prints the same information with exact excerpts of the rule text.

### MURC publishes MUFG Bank's rates

The rates are MUFG Bank's own published customer rates, and MURC states that it shows the bank's final quote of each day. The NTA rules generally ask for the rate of *your* main bank (主たる取引金融機関), but they also accept a reasonable rate that you use consistently ([所得税基本通達57の3-2 注1](https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm)). That clause is why MUFG's rates are commonly used. Some rules instead name a specific institution, such as the bank that holds a deposit or the broker that pays you. In those cases, use that institution's rate or statement.

How much the choice of bank matters depends on the rate type. Major banks' TTMs usually agree within a few sen. TTS and TTB spreads differ much more: about ±1 yen per USD at major banks, but much less at some online banks.

### Which rate type a rule specifies

| Purpose | Guide topic / `purpose` | Rate | Whose rate | Rule |
| --- | --- | --- | --- | --- |
| General income, salary, stock option exercise | `general` | TTM on the transaction date | Your main bank, or a reasonable rate used consistently | [所基通57の3-2](https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm) |
| Foreign stock sale proceeds | `stock-sale` | TTB on the trade date | The paying broker, if it publishes a rate | [措通37の10・37の11共-6](https://www.nta.go.jp/law/tsutatsu/kobetsu/shotoku/sochiho/020624/sanrin/1273/37_10-11/01.htm) |
| Foreign stock acquisition cost | `stock-acquisition` | TTS on the trade date | Same as above | Same |
| Foreign dividends paid through a domestic paying agent | `dividend` | TTB on the payment start date | The paying agent, if it publishes a rate | [措通9の2-2](https://www.nta.go.jp/law/tsutatsu/kobetsu/shotoku/sochiho/880331/gensen/58/09/02.htm) |
| Inherited or gifted assets | `inheritance-asset` | Final TTB on the valuation date | Your bank; for a deposit, the bank holding it | [財産評価基本通達4-3](https://www.nta.go.jp/law/tsutatsu/kihon/sisan/hyoka_new/01/01.htm) |
| Inherited debts | `inheritance-debt` | Final TTS on the valuation date | Same as above | Same |
| 国外財産調書 | `foreign-asset-report` | TTB on December 31 | Your bank; for a deposit, the bank holding it | [国外送金等調書法通達5-14](https://www.nta.go.jp/law/tsutatsu/kobetsu/hotei/2207xx/pdf/01.pdf) |
| Customs value of imports | `import` (guide only) | Customs weekly rate for the week of the declaration | Japan Customs | [関税定率法4条の7](https://www.customs.go.jp/tetsuzuki/c-answer/imtsukan/1406_jr.htm) |
| Reports under the Foreign Exchange Act | `foreign-exchange-report` (guide only) | Basic or cross rate for the month; some reports use the reporting ordinance rate | Bank of Japan announcement | [外国為替令21条](https://www.boj.or.jp/about/services/tame/tame_rate/exhou.htm) |

The `purpose` option of `convertCurrency` covers the MURC rows and only selects the rate type; you still pass the date the rule specifies. When the date has no published rate, every rule above uses the nearest earlier date, which is what `fetchRates` returns.

```ts
const result = await convertCurrency({
    amount: 1000,
    from: 'USD',
    to: 'JPY',
    date: '2025-01-06',
    purpose: 'stock-sale' // uses TTB
})
```

If you sold through a Japanese broker, its annual trade report (年間取引報告書) already uses the broker's own rates.

### Data corrections

MURC has corrected historical values before: its archive page announced corrections to some values since 1990, reposted on 2024-04-19 with an errata PDF. Fetch rates when you need them instead of relying on old copies, and check important values against the linked source page.

Always verify calculations against the official source pages and consult a qualified professional for your specific situation.

## Legal And Source Use

This package is an unofficial software client. It is not affiliated with, authorized by, sponsored by, or endorsed by MUFG Bank, MURC, Japan Customs, the Bank of Japan, or the National Tax Agency.

The package fetches public source pages at runtime, on request, with an identifying user-agent that points to the npm package page. It returns parsed rate facts with source URLs and attribution; it does not bundle source data. Each source has its own terms:

| Source | Terms | What you need to do |
| --- | --- | --- |
| MURC | [MURC site-use terms](https://www.murc.jp/about/) | Follow MURC's terms. This package does not grant permission to copy, redistribute, republish, or sell MURC pages, CSV files, XLS files, or other source content. Review the terms before public, commercial, cached, or high-volume use. |
| Japan Customs | [Customs terms](https://www.customs.go.jp/kyotsu/rules.htm), [PDL1.0](https://www.digital.go.jp/resources/open_data/public_data_license_v1.0) | Credit the source (results include an `attribution` string in the PDL1.0 format) and label values you derived. |
| Bank of Japan | [BOJ copyright and disclaimer](https://www.boj.or.jp/about/copyright.htm) | Credit the source. Commercial copying needs prior consultation with the BOJ. |

MURC's [FX FAQ](https://www.murc-kawasesouba.jp/fx/faq/faq.pdf) describes its pages as foreign-exchange information and notes that displayed rates are reference values. Rate availability, timing, and revisions are controlled by each source site.

Rate data can change, be delayed, or be unavailable. Verify important results against the linked source URLs. Do not use this package as the sole source for tax filing, accounting, legal, investment, trading, settlement, or real-time financial decisions.

<details>
<summary>Comparison with other sources</summary>

| Source | History | Rates | Notes |
| --- | --- | --- | --- |
| [MUFG / MURC](https://www.murc-kawasesouba.jp/fx/past_3month.php) (`jpy-rates/murc`) | Daily quotes since 1990 | TTS / TTB / TTM | Coverage varies by endpoint (yearly from 2003, monthly from 2005-09) |
| [Mizuho Bank](https://www.mizuhobank.co.jp/market/historical/index.html) | Public data from 2002 | CSV/text: middle only; [PDF backnumbers](https://www.mizuhobank.co.jp/market/historical/backnumber_b/index.html) include TTS / TTB / central | Historical page has both middle-rate data files and full quote PDFs |
| [SMBC](https://www.smbc.co.jp/market/backnumber/fixing/past.html) | Monthly | Middle only | USD, CHF, GBP, EUR only |
| [Bank of Japan](https://www.boj.or.jp/en/statistics/market/forex/fxdaily/index.htm) | Since 2007 | Interbank mid | Not customer rates |

</details>

## References

- [MURC foreign exchange main page](https://www.murc-kawasesouba.jp/fx/index.php)
- [MURC FX FAQ PDF](https://www.murc-kawasesouba.jp/fx/faq/faq.pdf)
- [MURC site-use terms](https://www.murc.jp/about/)
- [Japan Customs exchange rates](https://www.customs.go.jp/tetsuzuki/kawase/index.htm)
- [Bank of Japan conversion rates for reports](https://www.boj.or.jp/about/services/tame/tame_rate/index.htm)
- [NTA basic directive 57の3-2](https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm)
- [NTA foreign-asset FAQ PDF](https://www.nta.go.jp/publication/pamph/hotei/kokugai_zaisan/pdf/kokugai_faq_h2_01.pdf)
