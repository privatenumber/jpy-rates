export type SourceId = 'murc' | 'customs' | 'boj' | 'boj-stat';

export type RateSource = {
	id: SourceId;
	name: string;
	publisher: string;
	provides: string;
	coverage: string;
	url: string;
	terms: {
		summary: string;
		url: string;
	};

	/** Credit to show when publishing data from this source. */
	attribution: string;
};

// Terms were read on 2026-11-06. See notes/jpy-rates/source-terms.md.
export const rateSources: RateSource[] = [
	{
		id: 'murc',
		name: 'MURC foreign exchange quotations',
		publisher: 'MURC, publishing MUFG Bank\'s customer rates',
		provides: 'Daily TTS/TTB/TTM, cash rates, month-end, year-end, reference, and world rates',
		coverage: 'Daily rates from 1990',
		url: 'https://www.murc-kawasesouba.jp/fx/index.php',
		terms: {
			summary: 'Follow MURC\'s site-use terms. Fetch on request; do not redistribute the source files.',
			url: 'https://www.murc.jp/about/',
		},
		attribution: 'Source: MUFG Bank exchange quotations published by MURC (https://www.murc-kawasesouba.jp/fx/)',
	},
	{
		id: 'customs',
		name: 'Japan Customs exchange rates for customs valuation',
		publisher: 'Japan Customs (Ministry of Finance)',
		provides: 'Weekly rates for converting customs value, announced by the Director-General of Customs',
		coverage: 'Weekly from 2008',
		url: 'https://www.customs.go.jp/tetsuzuki/kawase/index.htm',
		terms: {
			summary: 'Public Data License 1.0 (CC BY 4.0 compatible). Numeric data is not copyrighted; credit the source.',
			url: 'https://www.customs.go.jp/kyotsu/rules.htm',
		},
		attribution: '出典：税関ウェブサイト（https://www.customs.go.jp/tetsuzuki/kawase/index.htm）、PDL1.0（https://www.digital.go.jp/resources/open_data/public_data_license_v1.0）',
	},
	{
		id: 'boj',
		name: 'Bank of Japan conversion rates for foreign exchange reports',
		publisher: 'Bank of Japan, announcing rates set by the Minister of Finance',
		provides: 'Monthly basic and cross rates (基準・裁定外国為替相場) and reporting ordinance rates (報告省令レート)',
		coverage: 'Monthly',
		url: 'https://www.boj.or.jp/about/services/tame/tame_rate/index.htm',
		terms: {
			summary: 'Copying is allowed with attribution, except commercial copying, which needs prior consultation with the BOJ.',
			url: 'https://www.boj.or.jp/about/copyright.htm',
		},
		attribution: '出典：日本銀行ウェブサイト（https://www.boj.or.jp/about/services/tame/tame_rate/index.htm）',
	},
	{
		id: 'boj-stat',
		name: 'Bank of Japan Time-Series Data Search API',
		publisher: 'Bank of Japan',
		provides: 'Tokyo interbank USD/JPY spot rates (daily and monthly) and the yen\'s effective exchange rate indices',
		coverage: 'Daily from 1998, monthly from 1973, effective indices from 1970',
		url: 'https://www.stat-search.boj.or.jp/',
		terms: {
			summary: 'No API key. Services must show the BOJ credit text and must not send high-frequency requests.',
			url: 'https://www.stat-search.boj.or.jp/ssi/docs/info/api_notice.pdf',
		},
		// Credit text required by the API terms, section 2
		attribution: 'このサービスは、日本銀行時系列統計データ検索サイトの API 機能を使用しています。サービスの内容は日本銀行によって保証されたものではありません。',
	},
];
