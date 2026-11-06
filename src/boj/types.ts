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
};

export type ReportingRate = {
	code: string;

	/** Number of currency units the rate is quoted for */
	unit: number;

	/** JPY per `unit` currency units */
	rate: number;
};

export type ReportingRatesResult = {

	/** URL of the XLSX file the rates were parsed from */
	source: string;
	attribution: string;

	/** Month the rates apply to (YYYY-MM) */
	month: string;
	rates: Record<string, ReportingRate>;
};
