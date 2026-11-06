---
name: jpy-rates
description: Finding the JPY exchange rate that a Japanese tax filing or report requires (確定申告, stock sales and dividends, RSU/stock options, inheritance and gift tax, 国外財産調書, import customs value, 外為法 reports) and fetching it from MURC (MUFG Bank TTS/TTB/TTM), Japan Customs, or the Bank of Japan with the rule text and source link.
---

# jpy-rates

Use jpy-rates when a task needs a yen conversion that must follow a Japanese rule. The rule decides the rate type (TTM, TTB, TTS, or a designated rate), the date, and the source; do not default to a market rate or TTM.

## Workflow

1. Identify the purpose, then run the guide for it:

   ```bash
   jpy-rates guide                 # list topics
   jpy-rates guide stock-sale      # rate, date rule, institution, rule excerpts, command
   ```

   | Task | Topic |
   | --- | --- |
   | Salary, business, or other foreign-currency income and expenses | `general` |
   | Stock option or RSU exercise/vest income | `stock-option` |
   | Foreign stock sale proceeds / acquisition cost | `stock-sale` / `stock-acquisition` |
   | Foreign dividends | `dividend` |
   | Inherited or gifted assets / debts | `inheritance-asset` / `inheritance-debt` |
   | 国外財産調書 (December 31 valuation) | `foreign-asset-report` |
   | Import customs value, import consumption tax | `import` |
   | FOB value on an export declaration | `export` |
   | 外為法 reports (payments, securities acquisitions) | `foreign-exchange-report` |

2. Run the command the guide prints, filling in the date the rule names:

   ```bash
   jpy-rates murc convert -a 1000 -f USD -t JPY -d 2025-01-06 -p stock-sale
   jpy-rates customs 2026-10-05 -c USD
   jpy-rates boj basic 2026-11 -c EUR
   ```

3. In the answer, state the rate, rate type, the date actually used (weekends and holidays fall back to the nearest earlier date), the source URL, and the rule citation from the guide.

Add `--json` to any command for structured output. `jpy-rates sources` lists the sources with coverage and terms.

## Caveats to pass on

- MURC publishes MUFG Bank's rates. Rules prefer the taxpayer's main bank but accept a reasonable rate used consistently. Rules that name a specific institution (the bank holding a deposit, the paying broker) require that institution's rate.
- A Japanese broker's 年間取引報告書 already applies the broker's rates; prefer it for stock sales and dividends through that broker.
- KRW and IDR are quoted per 100 units (`unit: 100`); tables mark them with `*`.
- Customs rates apply to the week containing the import declaration date.
- BOJ `basic` gives JPY rates; rows marked `derived` are computed as USD market rate × basic rate, as the announcement specifies. BOJ `reporting` rates are in USD, for reports that state amounts in USD.
- Out-of-range or future dates throw a range error; in-range dates without data return no result.
- This is source data, not tax advice; recommend checking with a tax professional for filing decisions.

## Other MURC commands

```bash
jpy-rates murc rates 2025-01-06            # daily TTS/TTB/TTM
jpy-rates murc daily                        # today's rates + cash rates
jpy-rates murc monthly 2025 1               # month-end + monthly average
jpy-rates murc yearly 2024                  # year-end + yearly average
jpy-rates murc reference 2024               # CNY, TWD, MYR, KRW, IDR, BRL, ARS, CLP local reference rates
jpy-rates murc world                        # world rates against USD
```

## Library

```ts
import { getGuideTopic } from 'jpy-rates'
import { convertCurrency } from 'jpy-rates/murc'

const topic = getGuideTopic('stock-sale')
const result = await convertCurrency({ amount: 1000, from: 'USD', to: 'JPY', date: '2025-01-06', purpose: 'stock-sale' })
```
