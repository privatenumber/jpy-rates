export type FetchOptions = {

	/** Cancels the request, including retries and business-day walkback. */
	signal?: AbortSignal;
};

export type RateValues = {
	tts: number | null;
	ttb: number | null;
	ttm: number | null;
};

// fetchRates
export type Rate = RateValues & {
	name: string;
	nameJa: string;
	unit: number;
};

export type RatesResult = {
	source: string;
	date: string;
	rates: Record<string, Rate>;
};

// convertCurrency
export type ConversionRateType = 'tts' | 'ttb' | 'ttm';

export type ConversionPurpose =
	| 'general'
	| 'stock-sale'
	| 'stock-acquisition'
	| 'dividend'
	| 'inheritance-asset'
	| 'inheritance-debt'
	| 'foreign-asset-report';

export type ConvertWithRatesOptions = {
	amount: number;
	from: string;
	to: string;

	/** Rate type to use. Defaults to TTM. Cannot be combined with `purpose`. */
	rate?: ConversionRateType;

	/** Selects the rate type that tax rules specify for this purpose. */
	purpose?: ConversionPurpose;
};

export type ConvertCurrencyOptions = ConvertWithRatesOptions & FetchOptions & {
	date: string | Date;
};

export type ConvertWithRatesResult = {
	source: string;
	sourceDate: string;
	amount: number;
	from: string;
	to: string;
	rate: ConversionRateType;
	purpose: ConversionPurpose | null;
	rateValue: number;
	unit: number;
	convertedAmount: number;
};

export type ConvertCurrencyResult = ConvertWithRatesResult & {
	requestedDate: string;
};

// fetchDaily
export type DailyRate = Rate;

export type CashRate = {
	selling: number;
	buying: number;
};

export type DailyResult = {
	source: string;
	date: string;
	rates: Record<string, DailyRate>;
	cashRates: Record<string, CashRate>;
};

// fetchMonthly
export type MonthlyRate = {
	name: string;
	nameJa: string;
	unit: number;
	monthEnd: RateValues;
	monthlyAverage: RateValues;
};

export type LocalMarketRate = {
	nameJa: string;
	name: string;
	selling: number | null;
	buying: number | null;

	/** Single published rate (e.g. a central rate) when there is no selling/buying split. */
	rate: number | null;

	/** Date of the quote (YYYY-MM-DD) when the source annotates one, such as "(1/27)". */
	quoteDate: string | null;
	sourceJa: string;
	source: string;
};

export type MonthlyResult = {
	source: string;
	year: number;
	month: number;
	rates: Record<string, MonthlyRate>;
	localMarketRates: Record<string, LocalMarketRate>;
};

// fetchYearly
export type YearlyRate = {
	name: string;
	nameJa: string;
	unit: number;
	yearEnd: RateValues;
	yearlyAverage: RateValues;
};

export type YearlyResult = {
	source: string;
	year: number;
	rates: Record<string, YearlyRate>;
};

// fetchWorld
export type WorldRate = {
	country: string;
	countryJa: string;
	currency: string;
	code: string;
	quotation: string;
	marketLevel: string;
	remarks: string;
};

export type WorldResult = {
	source: string;
	date: string;
	asia: WorldRate[];
	africa: WorldRate[];
	europe: WorldRate[];
	mideast: WorldRate[];
	americas: WorldRate[];
};

// fetchReference
export type ReferenceDailyRate = {
	date: string;
	tts: number | null;
	ttb: number | null;
};

export type ReferenceMonthlySummary = {
	month: number;
	high: number | null;
	low: number | null;
	average: number | null;
};

export type ReferenceCurrency = {
	sourceJa: string;

	/**
	 * JPY amount that `rates.perJpy` values are quoted against (1 or 100).
	 * Null when there are no per-JPY rates.
	 */
	perJpyUnit: number | null;
	rates: {
		perUsd?: ReferenceDailyRate[];
		perJpy?: ReferenceDailyRate[];
	};
	monthlySummary: ReferenceMonthlySummary[];
};

export type ReferenceResult = {
	source: string[];
	year: number;
	currencies: Record<string, ReferenceCurrency>;
};

// archive workbook
export type ArchiveDailyRate = {
	date: string;
	tts: number;
	ttb: number;
	ttm: number;
};

// Values are TTM. Null when the workbook does not publish the value
// (e.g. 1990-2000 workbooks only publish monthly averages).
export type ArchiveMonthlySummary = {
	month: number;
	high: number | null;
	low: number | null;
	average: number | null;
};

export type ArchiveAnnualSummary = {
	high: number | null;
	low: number | null;
	average: number | null;
};

export type ArchiveCurrency = {
	unit: number;
	daily: ArchiveDailyRate[];
	monthly: ArchiveMonthlySummary[];
	annual: ArchiveAnnualSummary;
};

export type ArchiveResult = {

	/** Source URL supplied by the caller, or null for workbooks of unknown origin. */
	source: string | null;
	year: number;
	currencies: Record<string, ArchiveCurrency>;
};
