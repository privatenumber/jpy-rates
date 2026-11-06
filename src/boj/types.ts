export type ReferenceRate = {
	code: string | null;
	nameJa: string;
	unit: number;

	/** USD per `unit` currency units. */
	usd: number;
};

export type BasicRatesResult = {

	/** URL of the BOJ page the rates were parsed from */
	source: string;
	attribution: string;

	/** Month the rates apply to (YYYY-MM) */
	month: string;

	/** JPY per 1 USD (基準外国為替相場) */
	basic: number;

	/** JPY per 1 unit of each listed currency (裁定外国為替相場), keyed by ISO 4217 code */
	cross: Record<string, number>;

	/** Earlier month whose market averages are quoted below (YYYY-MM). */
	referenceMonth: string;

	/** Published market quotes in their original order. */
	reference: ReferenceRate[];

	/**
	 * JPY per `unit` currency units, derived by jpy-rates from each USD market
	 * quote and the basic rate. BOJ specifies no rounding; multiplication is
	 * normalized to 12 significant digits to remove floating-point noise.
	 * BOJ describes these as
	 * "市場実勢を基準外国為替相場をもって裁定した相場".
	 * https://www.boj.or.jp/about/services/tame/tame_rate/kijun/kiju2611.htm
	 */
	arbitrated: Record<string, { unit: number;
		rate: number; }>;
};

export type ReportingRate = {
	code: string;

	/** Number of currency units the rate is quoted for */
	unit: number;

	/** USD per `unit` currency units. */
	usd: number;
};

export type ReportingRatesResult = {

	/** URL of the publication the rates were parsed from */
	source: string;
	attribution: string;

	/** Month the rates apply to (YYYY-MM) */
	month: string;
	rates: Record<string, ReportingRate>;
};
