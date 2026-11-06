import type { SourceId } from './sources.ts';

export type GuideRule = {

	/** Citation name, such as 所得税基本通達57の3-2 */
	name: string;
	url: string;

	/** Exact excerpts of the rule text. Official notices are not copyrighted (著作権法13条). */
	excerpts: string[];
};

export type GuideTopic = {
	id: string;
	title: string;
	titleJa: string;
	source: SourceId;

	/** Which rate to use, such as TTB */
	rate: string;

	/** Which date's rate to use */
	date: string;

	/** Whose rate the rule asks for */
	institution: string;
	rules: GuideRule[];
	notes: string[];

	/** CLI command that fetches the rate, with <placeholders> */
	command: string;
};

// Excerpts were copied from the linked pages on 2026-11-06.
// See notes/jpy-rates/tax-rate-selection.md for the research behind each topic.
const incomeTaxDirective = {
	name: '所得税基本通達57の3-2',
	url: 'https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm',
};

const stockDirective = {
	name: '措置法通達37の10・37の11共-6',
	url: 'https://www.nta.go.jp/law/tsutatsu/kobetsu/shotoku/sochiho/020624/sanrin/1273/37_10-11/01.htm',
};

const valuationDirective = {
	name: '財産評価基本通達4-3',
	url: 'https://www.nta.go.jp/law/tsutatsu/kihon/sisan/hyoka_new/01/01.htm',
};

const mainBankNote = 'MURC publishes MUFG Bank\'s rates. The rule prefers your main bank\'s rate, but accepts a reasonable rate used consistently.';
const holdingBankNote = 'For a deposit, the rule requires the rate of the bank holding it. MUFG Bank\'s rate is only correct when that bank is MUFG Bank.';

export const guideTopics: GuideTopic[] = [
	{
		id: 'general',
		title: 'General foreign-currency income and expenses',
		titleJa: '外貨建取引の円換算（原則）',
		source: 'murc',
		rate: 'TTM',
		date: 'Transaction date; if there is no rate that day, the nearest earlier date',
		institution: 'Your main bank, or a reasonable rate used consistently',
		rules: [
			{
				...incomeTaxDirective,
				excerpts: [
					'その取引を計上すべき日（以下この項において「取引日」という。）における対顧客直物電信売相場（以下57の3－６までにおいて「電信売相場」という。）と対顧客直物電信買相場（以下57の3－６までにおいて「電信買相場」という。）の仲値（以下57の3－６までにおいて「電信売買相場の仲値」という。）による。',
					'電信売相場、電信買相場及び電信売買相場の仲値については、原則として、その者の主たる取引金融機関のものによることとするが、合理的なものを継続して使用している場合には、これを認める。',
					'当該日に為替相場がない場合には、同日前の最も近い日の為替相場による。',
				],
			},
		],
		notes: [
			mainBankNote,
			'Business, real-estate, and miscellaneous business income may use TTB for income and assets and TTS for expenses and debts, or averages over one month or less, if used consistently (same directive).',
			'Corporate tax follows the same structure (法人税基本通達13の2-1-2).',
		],
		command: 'jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <transaction-date> -p general',
	},
	{
		id: 'stock-option',
		title: 'Stock option exercise income (salary)',
		titleJa: 'ストックオプションの権利行使益',
		source: 'murc',
		rate: 'TTM',
		date: 'Exercise date',
		institution: 'A financial institution\'s published rate',
		rules: [
			{
				name: '国税庁 確定申告書等作成コーナー（外貨建てのストックオプションの収入の入力例）',
				url: 'https://www.keisan.nta.go.jp/r7yokuaru/ocat2/ocat21/cid477.html',
				excerpts: ['権利行使時の電信売買相場の仲値（TTM）で日本円に換算'],
			},
		],
		notes: [mainBankNote],
		command: 'jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <exercise-date> -p general',
	},
	{
		id: 'stock-sale',
		title: 'Foreign stock sale proceeds',
		titleJa: '外国株式の譲渡対価',
		source: 'murc',
		rate: 'TTB',
		date: 'Trade date (約定日)',
		institution: 'The paying broker if it publishes a TTB, otherwise its main bank',
		rules: [
			{
				...stockDirective,
				excerpts: ['約定日におけるその支払をする者の主要取引金融機関（その支払をする者がその外貨に係る対顧客直物電信買相場を公表している場合には、当該支払をする者）の当該外貨に係る対顧客直物電信買相場により邦貨に換算した金額による。'],
			},
		],
		notes: [
			'A Japanese broker\'s annual trade report (年間取引報告書) already applies the broker\'s own rates; use it when you have one.',
			'The directive refers to a Japanese broker\'s foreign securities account. For foreign brokers, TTB/TTS is common practice but is not stated by the directive.',
		],
		command: 'jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <trade-date> -p stock-sale',
	},
	{
		id: 'stock-acquisition',
		title: 'Foreign stock acquisition cost',
		titleJa: '外国株式の取得価額',
		source: 'murc',
		rate: 'TTS',
		date: 'Trade date (約定日)',
		institution: 'Same as stock-sale',
		rules: [
			{
				...stockDirective,
				excerpts: ['なお、取得の対価の額の邦貨換算については、対顧客直物電信売相場により、上記に準じて行う。'],
			},
		],
		notes: ['Same scope notes as stock-sale.'],
		command: 'jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <trade-date> -p stock-acquisition',
	},
	{
		id: 'dividend',
		title: 'Foreign stock dividends through a domestic paying agent',
		titleJa: '国外株式の配当等',
		source: 'murc',
		rate: 'TTB',
		date: 'Payment start date (支払開始日) for registered shares',
		institution: 'The paying agent if it publishes a TTB, otherwise its main bank',
		rules: [
			{
				name: '措置法通達9の2-2',
				url: 'https://www.nta.go.jp/law/tsutatsu/kobetsu/shotoku/sochiho/880331/gensen/58/09/02.htm',
				excerpts: [
					'当該外国通貨に係る東京外国為替市場の対顧客直物電信買相場（以下9の2－3までにおいて「電信買相場」という。）により邦貨に換算した金額',
					'記名の国外株式の配当等 支払開始日と定められている日',
					'国外株式の配当等から控除する外国所得税の額の邦貨換算については、当該国外株式の配当等に係る邦貨換算日における電信買相場によるものとする。',
				],
			},
		],
		notes: ['The directive covers dividends handled by a domestic paying agent (支払の取扱者). For dividends through a foreign broker, the general TTM rule may apply instead.'],
		command: 'jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <payment-date> -p dividend',
	},
	{
		id: 'inheritance-asset',
		title: 'Inherited or gifted foreign-currency assets',
		titleJa: '相続・贈与財産（外貨建て）の邦貨換算',
		source: 'murc',
		rate: 'TTB (the final quote of the day)',
		date: 'Valuation date (date of death or gift); if there is no rate that day, the nearest earlier date',
		institution: 'The taxpayer\'s bank; for a deposit, the bank holding it',
		rules: [
			{
				...valuationDirective,
				excerpts: ['外貨建てによる財産及び国外にある財産の邦貨換算は、原則として、納税義務者の取引金融機関（外貨預金等、取引金融機関が特定されている場合は、その取引金融機関）が公表する課税時期における最終の為替相場（邦貨換算を行なう場合の外国為替の売買相場のうち、いわゆる対顧客直物電信買相場又はこれに準ずる相場をいう。また、課税時期に当該相場がない場合には、課税時期前の当該相場のうち、課税時期に最も近い日の当該相場とする。）による。'],
			},
		],
		notes: [holdingBankNote, 'Foreign cash is also valued at TTB, not the cash buying rate (国税庁 質疑応答事例「外貨(現金)の評価」).'],
		command: 'jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <valuation-date> -p inheritance-asset',
	},
	{
		id: 'inheritance-debt',
		title: 'Inherited foreign-currency debts',
		titleJa: '相続債務（外貨建て）の邦貨換算',
		source: 'murc',
		rate: 'TTS (the final quote of the day)',
		date: 'Valuation date',
		institution: 'Same as inheritance-asset',
		rules: [
			{
				...valuationDirective,
				excerpts: ['外貨建てによる債務を邦貨換算する場合には、この項の「対顧客直物電信買相場」を「対顧客直物電信売相場」と読み替えて適用することに留意する。'],
			},
		],
		notes: [holdingBankNote],
		command: 'jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <valuation-date> -p inheritance-debt',
	},
	{
		id: 'foreign-asset-report',
		title: 'Statement of foreign assets (国外財産調書)',
		titleJa: '国外財産調書の邦貨換算',
		source: 'murc',
		rate: 'TTB (the final quote of the day)',
		date: 'December 31; if there is no rate that day, the nearest earlier date',
		institution: 'The filer\'s bank; for a deposit, the bank holding it',
		rules: [
			{
				name: '国外送金等調書法通達5-14',
				url: 'https://www.nta.go.jp/law/tsutatsu/kobetsu/hotei/2207xx/pdf/01.pdf',
				excerpts: [
					'国外財産の邦貨換算は、国外財産調書の提出義務者の取引金融機関（その財産が預金等で、取引金融機関が特定されている場合は、その取引金融機関）が公表するその年の 12 月 31 日における最終の為替相場による。',
					'いわゆる対顧客直物電信買相場又はこれに準ずる相場をいう。',
				],
			},
		],
		notes: [holdingBankNote, 'The same date and rate decide whether the 50 million yen filing threshold is exceeded.'],
		command: 'jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <year>-12-31 -p foreign-asset-report',
	},
	{
		id: 'import',
		title: 'Customs value of imported goods (also the base of import consumption tax)',
		titleJa: '輸入貨物の課税価格の換算',
		source: 'customs',
		rate: 'Customs weekly rate',
		date: 'Import declaration date; the rate published for the week containing it',
		institution: 'Japan Customs (not a bank rate)',
		rules: [
			{
				name: '関税定率法第4条の7、関税定率法施行規則第1条（カスタムスアンサー1406）',
				url: 'https://www.customs.go.jp/tetsuzuki/c-answer/imtsukan/1406_jr.htm',
				excerpts: ['その外国為替相場は、輸入申告の日の属する週の前々週における実勢外国為替相場の当該週間の平均値に基づき、税関長により毎週公示されています。'],
			},
		],
		notes: ['Bank TTS/TTB rates and payment-date rates are not used for customs valuation.'],
		command: 'jpy-rates customs <declaration-date> -c <currency>',
	},
	{
		id: 'foreign-exchange-report',
		title: 'Reports under the Foreign Exchange Act (外為法)',
		titleJa: '外為法の報告書における換算',
		source: 'boj',
		rate: 'Basic or cross rate (基準・裁定外国為替相場); some reports use the reporting ordinance rate (報告省令レート)',
		date: 'The month of the transaction or payment',
		institution: 'Rates set by the Minister of Finance and announced by the Bank of Japan',
		rules: [
			{
				name: '外国為替令第21条（日本銀行「報告書作成の際に使用するレート（換算レート）の説明」）',
				url: 'https://www.boj.or.jp/about/services/tame/tame_rate/exhou.htm',
				excerpts: ['当該規定においてその額について当該換算をすべき取引、行為又は支払等が行われる日における外為法第7条第1項に規定する基準外国為替相場又は裁定外国為替相場を用いて行うものとする。'],
			},
		],
		notes: [
			'Reports listed under 報告省令第35条第2号 use the reporting ordinance rate instead: jpy-rates boj reporting <YYYY-MM>.',
			'To decide whether a payment must be reported, a payment that involved a currency exchange uses that exchange\'s rate (日本銀行「外為法の報告制度について」).',
		],
		command: 'jpy-rates boj basic <YYYY-MM> -c <currency>',
	},
];

export const getGuideTopic = (id: string): GuideTopic | undefined => (
	guideTopics.find(topic => topic.id === id)
);
