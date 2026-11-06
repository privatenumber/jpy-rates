# Japan Customs source behavior

Verified 2026-11-06 against the live site with `pdfjs-dist` 6.5.438 on Node 24 (`fetchCustomsRates` in [`src/customs/fetch-rates.ts`](../../src/customs/fetch-rates.ts)).

## Index and links

[`tetsuzuki/kawase/index.htm`](https://www.customs.go.jp/tetsuzuki/kawase/index.htm) (Shift_JIS) links every weekly PDF from 2008 directly. File names encode the period, but the end date has 4, 6, or 8 digits depending on the year, for example `kouji-rate20080120-0126.pdf`, `kouji-rate20190428-190504.pdf`, and `kouji-rate20261004-20261010.pdf`. The adapter therefore discovers links from the index instead of building URLs, and validates each link's period against the period printed in the PDF.

## PDF text extraction

pdf.js needs its bundled Japanese CMaps (`cMapUrl`, `cMapPacked: true`); without them it silently omits Japanese text. `standardFontDataUrl` avoids a font warning. Both paths are resolved from the installed package so they work from `dist/` (checked with the built CLI).

`unpdf` 2.1.0 was rejected because it requires Node >= 24, outside `engines` (>= 22.22.2). `pdf-parse` wraps pdf.js and adds a native canvas dependency.

## Period text

The period line reads, for example, `適用期間：令和８年10月４日から令和８年10月10日まで`. The 2019 era-transition week prints `平成31年4月28日から平成31年(2019年)5月4日まで` (NFKC-normalized): Heisei 31 for a May date, with the Western year in parentheses. The parser accepts the annotation when it agrees with the era year and otherwise rejects era dates outside their era.

Eight consecutive 2011 weeks (2011-05-29 to 2011-07-17) print a space before single-digit months and days, such as `平成23年 6月12日`; the parser removes whitespace before matching.

A full sweep on 2026-11-07 parsed all 984 weekly PDFs (2008-01-06 to 2026-11-14) with the row-count cross-check, after the whitespace fix. The index had no gaps between weeks, and every period was 7 days.

| Requested date | Period | Rates | USD |
| --- | --- | ---: | ---: |
| 2008-01-20 | 2008-01-20 to 2008-01-26 | 98 | 109.50 |
| 2015-10-05 | 2015-10-04 to 2015-10-10 | 94 | 120.27 |
| 2019-05-01 | 2019-04-28 to 2019-05-04 | 93 | 111.97 |
| 2020-12-07 | 2020-12-06 to 2020-12-12 | 92 | 104.36 |
| 2026-11-06 | 2026-11-01 to 2026-11-07 | 85 | 157.91 |

The 2015, 2020, and 2026 USD, EUR, and KRW values matched an independent `pdftotext` reading of the same PDFs.

## Rows

Columns are 国名符号, 国名, 通貨, ISO, then the rate in either a "per 1 unit" or a "per 100 units" column. The parser locates each row by its ISO code and reads neighbouring text by position. To avoid silently dropping a row whose code is not extracted, it counts the 国名符号 markers on each page independently and throws when the counts differ. EUR is the observed exception: its row has no 国名符号, so its published country label serves as the marker.

Some rows cover several countries with an abbreviated label, such as `329他 グレナダ他 東カリブドル XCD`; `countries` keeps the published label.

## Equivalent currencies

BND is published as `シンガポール・ドルと等価` instead of a number. The adapter copies the SGD row's unit and rate and sets `equivalentTo: 'SGD'`, so the value is labeled as derived (PDL1.0 requires marking processed content).
