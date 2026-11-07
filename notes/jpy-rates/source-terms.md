# Source terms of use

Read 2026-11-06. This is a reading of published terms, not legal advice. The per-source summaries in [`src/guide/sources.ts`](../../src/guide/sources.ts) (`jpy-rates sources`) are the user-facing copy; update both when terms change.

## Conclusion

All implemented sources allow a free, open-source client that fetches on request and credits the source. None requires an API key. Obligations differ:

| Source | Terms | Obligation for jpy-rates |
| --- | --- | --- |
| MURC | [MURC site-use terms](https://www.murc.jp/about/) | Fetch on request; do not redistribute source pages or files; keep raw data out of the repository (`scripts/check-raw-data.mjs`) |
| Japan Customs | [Customs terms](https://www.customs.go.jp/kyotsu/rules.htm) apply [PDL1.0](https://www.digital.go.jp/resources/open_data/public_data_license_v1.0) | Credit the source in the PDL1.0 format; label derived values |
| Bank of Japan (boj.or.jp) | [BOJ copyright page](https://www.boj.or.jp/about/copyright.htm) | Credit the source; commercial copying needs prior consultation; do not modify content |

## Japan Customs

The Customs terms page says content is under 公共データ利用規約（第1.0版）(PDL1.0) unless marked otherwise; the only exclusions listed are the Customs logo marks and the mascot character.

PDL1.0 allows copying, public transmission, and adaptation, states `商用利用も可能です`, and is compatible with CC BY 4.0. Two clauses matter here:

- `数値データ、簡単な表・グラフ等は著作権による保護の対象ではありませんので、これらについては本利用ルールの適用はなく、自由に利用できます。` The parsed rates are numeric data.
- Credit format: `出典：D庁ウェブサイト（当該ページのURL）、PDL1.0（規約原文ページのURL）`. Edited or processed content must say so and must not be presented as an unmodified government original.

The `customs` entry in `src/guide/sources.ts` carries the credit string in that format.

## Bank of Japan

The main site's copyright page allows 転載・複製 with the source stated (`出所を明記`), except:

1. commercial copying (`商用目的で転載・複製を行う場合`),
2. content marked 無断転載禁止,
3. photos, illustrations, and images.

Those cases need prior consultation with the BOJ, and content may not be modified without permission.

Inference, not stated by the BOJ: the 基準外国為替相場 and 裁定外国為替相場 pages are 財務大臣公示 (announcements by the Minister of Finance). 著作権法13条2号 excludes `告示、訓令、通達その他これらに類するもの` from copyright, so the announced values themselves are likely not protected. The same reasoning applies to the Customs 税関長公示 rates and to the NTA directive excerpts quoted in `src/guide/topics.ts`.

### BOJ time-series API

The statistics site ([notes](https://www.stat-search.boj.or.jp/ssi/docs/info/notice.html)) has the same copying rules. Its API terms ([api_notice.pdf](https://www.stat-search.boj.or.jp/ssi/docs/info/api_notice.pdf)) add:

- notify the BOJ (`post.rsd17@boj.or.jp`, subject `【検索サイト API を利用したサービス公開】`) when publishing a service that uses the API;
- show the credit `このサービスは、日本銀行時系列統計データ検索サイトの API 機能を使用しています。サービスの内容は日本銀行によって保証されたものではありません。`;
- no high-frequency access.

The terms were re-read on 2026-11-07. They are usage conditions (`以下の留意点を遵守してください`), not a statute; the credit is phrased as a request (`クレジット表示をお願いいたします`) and may be shown anywhere users can see it. No API key or registration is required.

Implemented on 2026-11-07 as `boj market` and `boj effective` ([`src/boj/stat-api.ts`](../../src/boj/stat-api.ts)), after the maintainer chose to support it because it needs no key. How each condition is met:

- Credit: the `boj-stat` source `attribution` is the exact credit text. Every result carries it, the CLI prints it, and the README terms table names it.
- Access: requests are made only when the user asks, and each call fetches one month of all needed series in a single request. Since 2026-11-07, [`fetchSource`](../../src/utils/fetch-source.ts) retries network errors and HTTP 502/503/504 at most twice, after 0.5 s and 1 s, so one call makes at most three requests. Other statuses are not retried, so a client error never repeats.
- Notification: not sent yet. See the checklist below.

The API serves interbank market rates, not the customer or designated rates that the tax and reporting rules require, so no guide topic points to it.

### Before the first npm publish

- [ ] The maintainer emails `post.rsd17@boj.or.jp` with the subject `【検索サイト API を利用したサービス公開】`, naming the package (npm and GitHub URLs) and the series used (FM08: FXERD01-05, FXERM03/05-09; FM09: FX180110001-2). The API terms require this notice when a service that uses the API is published. An agent must not send it.

## Evaluated, not implemented

| Source | Finding | Decision |
| --- | --- | --- |
| US Treasury Fiscal Data | [About page](https://fiscaldata.treasury.gov/about-us/): `available to copy, adapt, redistribute, or otherwise use for non-commercial and commercial purposes.` Rates of Exchange API returned quarterly JPY rates without a key (2026-09-30: 157.09). | Deferred; serves US filers, not Japanese rules |
| Mizuho, SMBC, Rakuten Securities | Terms not verified: Mizuho returned HTTP 403 to scripted requests; Rakuten's terms page was not found | Not pursued until terms are read in a browser |
