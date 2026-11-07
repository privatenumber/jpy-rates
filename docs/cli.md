# CLI

```bash
npx jpy-rates <command>
```

Or install it globally with `npm install -g jpy-rates`. Requires Node.js 22.22.2 or later.

| Command | Use it to |
| --- | --- |
| [`guide`](#guide) | Find which rate a tax or reporting rule requires |
| [`sources`](#sources) | List the data sources and their terms of use |
| [`murc`](#murc) | Get MUFG Bank customer rates (TTS/TTB/TTM) and convert amounts |
| [`customs`](#customs) | Get Japan Customs weekly rates for import and export valuation |
| [`boj`](#boj) | Get Bank of Japan rates for Foreign Exchange Act reports, Tokyo market USD/JPY, and effective exchange rates |

## Output

- Output is human-readable by default. Add `--json` for compact JSON with the full result, including `source` URLs and attribution.
- Currencies quoted per 100 units, such as KRW and IDR, are marked with `*` in tables.
- `-c, --currency` filters to one currency code and is case-insensitive.
- Colors are disabled when output is piped or `NO_COLOR` is set; `FORCE_COLOR` enables them. In CI (`CI` is set), piped output keeps colors, which is how [ansis](https://github.com/webdiscus/ansis) detects color support; set `NO_COLOR=1` for plain text there.
- Unknown flags are rejected with a suggestion. Errors print to stderr and exit with code 1, including HTTP errors and server errors that a source page prints. Transient HTTP 502, 503, and 504 responses are retried twice first.
- Dates are `YYYY-MM-DD` and months are `YYYY-MM`. Dates before a source's earliest data fail without a request. MURC commands also reject future dates; Customs and BOJ commands check with the source, because they publish ahead, and say when a period is not published yet.
- `murc` commands for today, on a weekday before MURC publishes (about 11:00 JST), exit with "not published yet" instead of using the previous business day's rate.
- Human-readable tables end with the source URL. Every command except `murc download-source` accepts `--json`.

## guide

```bash
jpy-rates guide [topic] [--json]
```

Without a topic, lists every purpose with its rate type and source:

```
Topic                    Rate                 Source   Use for
general                  TTM                  murc     General foreign-currency income and expenses
stock-option             TTM                  murc     Stock option exercise income (salary)
stock-sale               TTB                  murc     Foreign stock sale proceeds
stock-acquisition        TTS                  murc     Foreign stock acquisition cost
dividend                 TTB                  murc     Foreign stock dividends through a domestic paying agent
inheritance-asset        TTB                  murc     Inherited or gifted foreign-currency assets
inheritance-debt         TTS                  murc     Inherited foreign-currency debts
foreign-asset-report     TTB                  murc     Statement of foreign assets
import                   Customs weekly rate  customs  Customs value of imported goods (also the base of import consumption tax)
export                   Customs weekly rate  customs  FOB value on an export declaration
foreign-exchange-report  Basic or cross rate  boj      Reports under the Foreign Exchange Act (外為法)
```

With a topic, shows the rate type, the date rule, whose rate the rule asks for, exact excerpts of the rule with links, notes, and the command that fetches the rate.

## sources

```bash
jpy-rates sources [--json]
```

Lists each source with its publisher, coverage, URL, and terms of use.

## murc

MUFG Bank's customer rates, published by MURC. Daily TTS/TTB/TTM since 1990.

### murc convert

```bash
jpy-rates murc convert -a <amount> -f <currency> -t <currency> -d <date> [-r <rate> | -p <purpose>] [--json]
```

Converts between JPY and one foreign currency with the rate of `<date>`, or of the nearest earlier business day.

| Flag | Description |
| --- | --- |
| `-a, --amount <number>` | Amount to convert. Negative amounts are accepted. |
| `-f, --from <currency>` | Source currency |
| `-t, --to <currency>` | Target currency. One of `--from` and `--to` must be `JPY`. |
| `-d, --date <date>` | Conversion date |
| `-r, --rate <rate>` | `tts`, `ttb`, or `ttm` (default) |
| `-p, --purpose <purpose>` | Select the rate type a tax rule requires: `general`, `stock-sale`, `stock-acquisition`, `dividend`, `inheritance-asset`, `inheritance-debt`, `foreign-asset-report`. Cannot be combined with `--rate`. |

```bash
jpy-rates murc convert -a 1000 -f USD -t JPY -d 2025-01-06 -p stock-sale   # TTB
jpy-rates murc convert -a 150000 -f JPY -t EUR -d 2025-01-06 -r tts
```

The output names the rate, the date used, the bank (MUFG Bank, published by MURC), and the source URL. When a rule names your own broker or bank and it publishes a rate, that rate takes precedence.

### murc rates

```bash
jpy-rates murc rates <date> [-c <currency>] [--json]
```

TTS, TTB, and TTM for 31 currencies on a date. Weekends and holidays resolve to the nearest earlier business day.

### murc daily

```bash
jpy-rates murc daily [date] [-c <currency>] [--json]
```

Daily rates plus cash selling and buying rates. Defaults to today's published rates. Available from 2005-09-01.

### murc monthly

```bash
jpy-rates murc monthly <year> <month> [-c <currency>] [--json]
```

Month-end rates, monthly averages, and local market rates from MUFG branches. Local market rates are per 1 USD, as quoted in each market, with the quote date when MURC annotates one. If MURC's page shows a server error in that section, the output says the section is unavailable, and `-c` for a local currency explains why it is missing. Available from 2005-09. `-c` also matches local market currencies such as TWD.

### murc yearly

```bash
jpy-rates murc yearly <year> [-c <currency>] [--json]
```

Year-end rates and yearly averages. Available from 2003.

### murc reference

```bash
jpy-rates murc reference <year> [--json]
```

Local reference rates for currencies outside the main table: CNY, TWD, and MYR from 2006; KRW, IDR, BRL, ARS, and CLP from 2009. Each currency's heading states its basis: per 1 USD, or per 1 or 100 JPY.

### murc world

```bash
jpy-rates murc world [--json]
```

Reference rates for over 120 countries and territories against USD, grouped by region. Updated monthly. `Official` is the rate quoted by the monetary authorities, often a peg such as `B$ 1=S$ 1`; `Market Level` is the market rate. Both are units of the currency per 1 USD unless the text says otherwise.

### murc download-source and parse-archive

```bash
jpy-rates murc download-source <year> [-o <file>] [--force]
jpy-rates murc parse-archive <file> [--json]
```

`download-source` saves the official yearly XLS archive, unmodified. It refuses to overwrite an existing file unless you pass `--force`. `parse-archive` reads a local archive file and prints its annual summary, or the full daily, monthly, and annual data with `--json`.

## customs

```bash
jpy-rates customs <date> [-c <currency>] [--json]
```

Japan Customs weekly rates for the week that contains `<date>`, such as an import declaration date. Rates convert the customs value of imports, which is also the base of import consumption tax, and the FOB value on export declarations. Available from 2008. A week that is not announced yet prints a "not published" error.

```bash
jpy-rates customs 2026-11-06 -c usd
```

Currencies published as equal to another currency, such as BND to SGD, show the other currency in the `Note` column.

## boj

`basic` and `reporting` are the Bank of Japan announcements of the rates for reports under the Foreign Exchange Act (外為法), monthly from 2016-01. `market` and `effective` read the BOJ Time-Series Data Search API, which needs no API key; their output includes the credit text the API terms require.

### boj basic

```bash
jpy-rates boj basic <YYYY-MM> [-c <currency>] [--json]
```

The basic rate (基準外国為替相場, JPY per USD), the six published cross rates (裁定外国為替相場), and JPY rates for other currencies. Rows marked `derived` are computed by jpy-rates as the published USD market rate times the basic rate, as the announcement specifies.

### boj reporting

```bash
jpy-rates boj reporting <YYYY-MM> [-c <currency>] [--json]
```

The reporting ordinance rates (報告省令レート), quoted in USD per stated currency units, for reports that state amounts in USD.

### boj market

```bash
jpy-rates boj market <YYYY-MM-DD | YYYY-MM> [--daily] [--json]
```

Tokyo interbank USD/JPY spot rates in JPY per USD. These are market rates, not the bank customer or designated rates that the tax and reporting rules in [`guide`](#guide) name.

- With a date, prints that day's 9:00, 17:00, central (中心相場), high, and low rates. A weekend, a holiday, or a day not published yet exits with an error. Daily rates start in 1998 (the 17:00 rate) and 1999 (the others).
- With a month, prints the monthly average and month-end of the 17:00 and central rates, and the month's high and low. A month is summarized after it ends. Monthly rates start in 1973 (the 17:00 rate) and 1992-08 (the others).
- `--daily` with a month lists every trading day instead.

```bash
jpy-rates boj market 2026-10-01
jpy-rates boj market 2026-10
jpy-rates boj market 2026-10 --daily
```

A value the BOJ does not have, such as the central rate before 1992-08, prints as `—` (`null` in JSON).

### boj effective

```bash
jpy-rates boj effective <YYYY-MM> [--json]
```

The yen's nominal and real effective exchange rate indices (実効為替レート), from 1970-01. A higher index means a stronger yen. An index the BOJ has not published yet prints as `—` (`null` in JSON); a month with neither index exits with an error.
