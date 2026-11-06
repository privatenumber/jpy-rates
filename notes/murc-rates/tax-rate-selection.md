# Rate selection for Japanese tax purposes

Researched 2026-11-06. This is a reading of NTA directives and practitioner sources, not tax advice.

## Conclusion

MURC's MUFG Bank rates are a sound general-purpose source, but no single rate is "the official rate". Two questions decide which number is correct:

1. **Rate type.** Rules specify TTM, TTB, or TTS depending on the purpose. Defaulting to TTM is wrong for stock sales, dividends, and asset valuations.
2. **Institution.** Most rules prefer the taxpayer's own bank, and some require a specific institution's rate, such as the bank holding a deposit or the paying broker. MUFG's rate is only the required rate when that institution is MUFG Bank. Otherwise it is acceptable under the "reasonable rate used consistently" clause where that clause applies.

The package therefore keeps MURC as its only source, adds a `purpose` option that selects the rate type ([`src/api/conversion-purpose.ts`](../../src/api/conversion-purpose.ts)), and documents the institution caveats in the README.

## Rules by purpose

| Purpose | Rate | Date | Institution | Rule |
| --- | --- | --- | --- | --- |
| General income (所得税) | TTM | Transaction date | Main bank in principle; a reasonable rate used consistently is accepted | [所得税基本通達57の3-2](https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm), 注1 |
| Business, real-estate, or miscellaneous business income | TTB for income and assets, TTS for expenses and debts, if used consistently; also month or week averages | Transaction date, or a period of one month or less | Same as above | Same, 本文ただし書き and 注2 |
| Corporate tax | Same structure as income tax | Transaction date | Same | [法人税基本通達13の2-1-2](https://www.nta.go.jp/law/tsutatsu/kihon/hojin/13_2/13_2_01.htm) |
| Stock option exercise income | TTM | Exercise date | Financial institutions' published rate | [NTA e-filing example](https://www.keisan.nta.go.jp/r7yokuaru/ocat2/ocat21/cid477.html) |
| Foreign stock sale proceeds | TTB | Trade date (約定日) | The paying broker if it publishes a TTB, otherwise its main bank | [措置法通達37の10・37の11共-6](https://www.nta.go.jp/law/tsutatsu/kobetsu/shotoku/sochiho/020624/sanrin/1273/37_10-11/01.htm) |
| Foreign stock acquisition cost | TTS | Trade date | Same as above | Same, last sentence |
| Foreign dividends through a domestic paying agent | TTB; foreign tax withheld also at TTB | Payment start date (registered shares) | The paying agent if it publishes a TTB, otherwise its main bank | [措置法通達9の2-2](https://www.nta.go.jp/law/tsutatsu/kobetsu/shotoku/sochiho/880331/gensen/58/09/02.htm) |
| Inheritance and gift: assets | Final TTB | Valuation date | Taxpayer's bank; for a deposit, the bank holding it | [財産評価基本通達4-3](https://www.nta.go.jp/law/tsutatsu/kihon/sisan/hyoka_new/01/01.htm), [タックスアンサー No.4665](https://www.nta.go.jp/taxes/shiraberu/taxanswer/hyoka/4665.htm) |
| Inheritance and gift: debts | Final TTS | Valuation date | Same as above | 財産評価基本通達4-3 (注) |
| 国外財産調書 | TTB | December 31 | Filer's bank; for a deposit, the bank holding it | [国外送金等調書法通達5-14](https://www.nta.go.jp/law/tsutatsu/kobetsu/hotei/2207xx/pdf/01.pdf), [FAQ 問18](https://www.nta.go.jp/publication/pamph/hotei/kokugai_zaisan/pdf/kokugai_faq.pdf) |

Common details:

- When the date has no rate, every rule above uses the nearest **earlier** date (所基通57の3-2 注3(1), 評基通4-3, 通達5-14). This matches the walkback in `fetchRates` and `fetchDaily`.
- Cash rates are not used even for foreign cash in an inheritance: the NTA answer [外貨(現金)の評価](https://www.nta.go.jp/law/shitsugi/hyoka/15/05.htm) values cash at TTB, not at the cash buying rate.
- If a broker's annual trade report (年間取引報告書) exists, it already applies the broker's rates, which 措通37の10・37の11共-6 prefers.

Scope limits, labeled as inference:

- 措通37の10・37の11共-6 refers to a domestic broker's 外国証券取引口座約款, and 措通9の2-2 to a domestic 支払の取扱者. For sales and dividends through a foreign broker, such as US employee-stock platforms, neither directive applies directly. Practitioners commonly still use TTB/TTS for sales; for dividends, the general TTM rule may apply. The `stock-sale` and `dividend` purposes document this scope instead of claiming it.
- A 2026-06-16 Supreme Court decision (令和5(行ヒ)366, [judgment PDF](https://www.courts.go.jp/assets/hanrei/hanrei-pdf-96174.pdf)) held that buying another currency or same-currency securities with foreign currency realizes the FX gain at that time. It refers to 所得税法57条の3 for the yen amount but does not name a rate type.

## How much the institution matters

TTMs of major banks almost match; TTS and TTB spreads do not. On 2026-11-06, the aggregator [valasindo](https://ja.valasindo.com/kawase-reeto/usd/jpy/) listed USD rates of:

| Bank | TTS | TTB | TTM |
| --- | --- | --- | --- |
| MUFG Bank | 158.77 | 156.77 | 157.77 |
| Mizuho Bank | 158.78 | 156.78 | 157.78 |
| SMBC | 158.77 | 156.77 | 157.77 |
| Sony Bank | 157.85 | 157.70 | 157.77 |

So for TTM-based rules the bank changes the result by about 0.01%, but for TTB-based rules MUFG's TTB can be about 0.6% below an online bank's TTB. That difference is why the README says to use the holding institution's rate where the rule names one. This is a single day's snapshot from a third-party aggregator; it shows the order of magnitude only.

## Alternatives considered

| Alternative | Decision | Reason | Re-evaluate when |
| --- | --- | --- | --- |
| Add a Mizuho source adapter ([historical CSV](https://www.mizuhobank.co.jp/market/historical/index.html)) | Rejected | The CSV is TTM only, from 2002, and contains first quotes only (`収録したデータはすべて初回公示分です`); TTS/TTB history is in per-day TXT (to 2024-03) and PDF files. For TTM it only cross-checks MURC, and it cannot serve final-quote rules. | A user needs Mizuho's TTB/TTS as their holding bank, or Mizuho publishes TTS/TTB history as data |
| SMBC past rates ([backnumber](https://www.smbc.co.jp/market/backnumber/fixing/past.html)) | Rejected | Published as per-day PDFs | SMBC publishes machine-readable history |
| Bank of Japan rates | Rejected | The BOJ publishes interbank center rates, not customer TTS/TTB/TTM | Never for customer-rate rules |
| Generic FX APIs (the approach freee's foreign-currency app documents in its [help page](https://support.freee.co.jp/hc/ja/articles/360029065452)) | Rejected | Not a customer rate of any institution; acceptable only under the "reasonable rate used consistently" clause, which MURC already satisfies with a bank rate | — |
| Keep MURC as the only source | Adopted | MUFG Bank's own customer rates; the day's final quote; TTS/TTB/TTM back to 1990 in HTML and XLS | — |

Prior art found on GitHub (searched 2026-11-06 with `gh search code murc-kawasesouba`): [matsubo/ttsttb](https://github.com/matsubo/ttsttb) (Ruby, daily TTS/TTB) and [lowply/stock-exchange](https://github.com/lowply/stock-exchange) (Go, USD TTM for RSU calculations). Neither covers rate-type selection by purpose.

## Project behavior

- `purpose` and `rate` are mutually exclusive; `rateTypeForPurpose` rejects unknown purposes. Tests: "purpose selects the rate type that tax rules specify" and "rejects combining rate and purpose, and unknown purposes" in [`tests/convert-currency.ts`](../../tests/convert-currency.ts), and "convert --purpose selects the rate type" in [`tests/cli.ts`](../../tests/cli.ts).
- `purpose` selects only the rate type. The caller passes the date the rule specifies, such as December 31 for `foreign-asset-report`; the package does not infer dates.
- The README table under "Which rate type a rule specifies" is the user-facing copy of this note. Update both when a directive changes.
