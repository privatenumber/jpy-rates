# jpy-rates

Get the yen exchange rate that a Japanese tax or reporting rule requires, with the rule text and a link to the official source.

Converting foreign amounts for 確定申告 is not "look up USD/JPY". Each rule names its own rate:

- foreign stock sales use the **TTB on the trade date**;
- the 国外財産調書 uses the **TTB on December 31**;
- imports use the **Customs weekly rate**.

jpy-rates knows which rule applies, and fetches the rate from the publisher the rule points to.

## Quick start

Ask which rate applies:

```console
$ npx jpy-rates guide stock-sale
Foreign stock sale proceeds (外国株式の譲渡対価)

Rate:        TTB
Date:        Trade date (約定日)
Institution: The paying broker if it publishes a TTB, otherwise its main bank
Source:      murc

措置法通達37の10・37の11共-6
https://www.nta.go.jp/law/tsutatsu/kobetsu/shotoku/sochiho/020624/sanrin/1273/37_10-11/01.htm
  「約定日におけるその支払をする者の主要取引金融機関（…）の当該外貨に係る対顧客直物電信買相場により邦貨に換算した金額による。」

Fetch the rate
  jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <trade-date> -p stock-sale
```

Then fetch it. Weekends and holidays fall back to the previous business day, as the rules require:

```console
$ npx jpy-rates murc convert -a 12000 -f USD -t JPY -d 2025-03-15 -p stock-sale
12,000 USD = 1,740,000 JPY
Rate: TTB 145.00 JPY per 1 USD (purpose: stock-sale)
Date: 2025-03-15 -> 2025-03-14
Source: https://www.murc-kawasesouba.jp/fx/past_3month_result.php?y=2025&m=3&d=14
```

(Rate values in this README are illustrative.)

## What you can do

### File taxes on foreign stock, RSUs, and dividends

```bash
jpy-rates murc convert -a 5000 -f USD -t JPY -d 2025-06-02 -p general            # RSU vest income (TTM)
jpy-rates murc convert -a 8000 -f USD -t JPY -d 2025-09-10 -p stock-acquisition  # purchase cost (TTS)
jpy-rates murc convert -a 9500 -f USD -t JPY -d 2025-11-20 -p stock-sale         # sale proceeds (TTB)
jpy-rates murc convert -a 120 -f USD -t JPY -d 2025-12-15 -p dividend            # dividends (TTB)
```

### Value foreign assets for 国外財産調書 and inheritance tax

```bash
jpy-rates guide foreign-asset-report
jpy-rates murc convert -a 300000 -f USD -t JPY -d 2025-12-31 -p foreign-asset-report
```

December 31 has no published rate, so the latest earlier rate is used, as the rule says.

### Convert import values for customs

```bash
jpy-rates customs 2026-11-06 -c usd
```

Gets the Japan Customs rate for the week of the import declaration, which also sets the base of import consumption tax.

### Prepare Foreign Exchange Act (外為法) reports

```bash
jpy-rates boj basic 2026-11 -c eur       # 基準・裁定外国為替相場
jpy-rates boj reporting 2026-11 -c eur   # 報告省令レート
```

### Look up historical rates

```bash
jpy-rates murc rates 1995-01-05      # daily TTS/TTB/TTM since 1990
jpy-rates murc monthly 2025 1        # month-end and monthly average
jpy-rates murc yearly 2024           # year-end and yearly average
```

Add `--json` to any command for structured output.

### Use it in code

```ts
import { getGuideTopic } from 'jpy-rates'
import { convertCurrency } from 'jpy-rates/murc'

getGuideTopic('stock-sale')?.rate // 'TTB'

const result = await convertCurrency({
    amount: 12_000,
    from: 'USD',
    to: 'JPY',
    date: '2025-03-15',
    purpose: 'stock-sale'
})
// { convertedAmount, rate: 'ttb', rateValue, sourceDate: '2025-03-14', source, ... }
```

### Give your coding agent the rules

The package ships with a built-in [agent skill](https://agentskills.io) that tells AI coding assistants which rate each task needs and how to cite it. Set up [`skills-npm`](https://github.com/antfu/skills-npm) in your project to use it.

## Sources

| Source | Rates | Used for |
| --- | --- | --- |
| [MURC](https://www.murc-kawasesouba.jp/fx/index.php) | [MUFG Bank](https://www.bk.mufg.jp/) customer TTS/TTB/TTM since 1990, cash rates, monthly and yearly summaries | Income tax, stock sales and dividends, inheritance, 国外財産調書 |
| [Japan Customs](https://www.customs.go.jp/tetsuzuki/kawase/index.htm) | Weekly rates for customs valuation since 2008 | Customs duty and import consumption tax |
| [Bank of Japan](https://www.boj.or.jp/about/services/tame/tame_rate/index.htm) | Monthly rates set by the Minister of Finance since 2016 | Foreign Exchange Act reports |

Every result links to the page or file it was parsed from. Data is fetched when you ask for it; nothing is bundled or cached.

## Install

```bash
npm install jpy-rates
```

Requires Node.js 22.22.2 or later. Run the CLI without installing via `npx jpy-rates`.

## Documentation

- [CLI](./docs/CLI.md): every command and flag
- [Node.js API](./docs/NODE.md): entry points, functions, and result shapes

## Before you file

- **MURC publishes MUFG Bank's rates.** The rules prefer your main bank's rate (主たる取引金融機関) but accept a reasonable rate used consistently ([所得税基本通達57の3-2](https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm)). Rules for deposits name the bank holding the deposit; use that bank's rate. If you sold through a Japanese broker, its 年間取引報告書 already applies the broker's rates.
- **Check the source.** Sources occasionally correct historical values; MURC reposted corrected values since 1990 on 2024-04-19. Verify important values against the linked page.
- This is source data, not tax, accounting, or legal advice. Consult a qualified professional for filing decisions.

## Legal

jpy-rates is an unofficial client. It is not affiliated with or endorsed by MUFG Bank, MURC, Japan Customs, the Bank of Japan, or the National Tax Agency. It fetches public pages on request with an identifying user-agent and returns parsed facts with their source. Each source has its own terms:

| Source | Terms | What you need to do |
| --- | --- | --- |
| MURC | [Site-use terms](https://www.murc.jp/about/) | Follow MURC's terms. This package grants no permission to redistribute or sell MURC content; review the terms before public, commercial, cached, or high-volume use. |
| Japan Customs | [Terms](https://www.customs.go.jp/kyotsu/rules.htm), [PDL1.0](https://www.digital.go.jp/resources/open_data/public_data_license_v1.0) | Credit the source; results include an `attribution` string in the PDL1.0 format. Label values you derive. |
| Bank of Japan | [Copyright and disclaimer](https://www.boj.or.jp/about/copyright.htm) | Credit the source. Commercial copying needs prior consultation with the BOJ. |
