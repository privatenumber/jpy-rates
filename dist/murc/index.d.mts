type FetchOptions = {
    /** Cancels the request, including retries and business-day walkback. */
    signal?: AbortSignal;
};
type RateValues = {
    tts: number | null;
    ttb: number | null;
    ttm: number | null;
};
type Rate = RateValues & {
    name: string;
    nameJa: string;
    unit: number;
};
type RatesResult = {
    source: string;
    date: string;
    rates: Record<string, Rate>;
};
type ConversionRateType = 'tts' | 'ttb' | 'ttm';
type ConversionPurpose = 'general' | 'stock-sale' | 'stock-acquisition' | 'dividend' | 'inheritance-asset' | 'inheritance-debt' | 'foreign-asset-report';
type ConvertWithRatesOptions = {
    amount: number;
    from: string;
    to: string;
    /** Rate type to use. Defaults to TTM. Cannot be combined with `purpose`. */
    rate?: ConversionRateType;
    /** Selects the rate type that tax rules specify for this purpose. */
    purpose?: ConversionPurpose;
};
type ConvertCurrencyOptions = ConvertWithRatesOptions & FetchOptions & {
    date: string | Date;
};
type ConvertWithRatesResult = {
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
type ConvertCurrencyResult = ConvertWithRatesResult & {
    requestedDate: string;
};
type DailyRate = Rate;
type CashRate = {
    selling: number;
    buying: number;
};
type DailyResult = {
    source: string;
    date: string;
    rates: Record<string, DailyRate>;
    cashRates: Record<string, CashRate>;
};
type MonthlyRate = {
    name: string;
    nameJa: string;
    unit: number;
    monthEnd: RateValues;
    monthlyAverage: RateValues;
};
type LocalMarketRate = {
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
type MonthlyResult = {
    source: string;
    year: number;
    month: number;
    rates: Record<string, MonthlyRate>;
    /**
     * Rates quoted in local markets, per 1 USD. null when the source page shows a
     * server error instead of this section, such as the latest month before MURC
     * uploads it; {} when the page lists none.
     */
    localMarketRates: Record<string, LocalMarketRate> | null;
};
type YearlyRate = {
    name: string;
    nameJa: string;
    unit: number;
    yearEnd: RateValues;
    yearlyAverage: RateValues;
};
type YearlyResult = {
    source: string;
    year: number;
    rates: Record<string, YearlyRate>;
};
type WorldRate = {
    country: string;
    countryJa: string;
    currency: string;
    code: string;
    quotation: string;
    marketLevel: string;
    remarks: string;
};
type WorldResult = {
    source: string;
    date: string;
    asia: WorldRate[];
    africa: WorldRate[];
    europe: WorldRate[];
    mideast: WorldRate[];
    americas: WorldRate[];
};
type ReferenceDailyRate = {
    date: string;
    tts: number | null;
    ttb: number | null;
};
type ReferenceMonthlySummary = {
    month: number;
    high: number | null;
    low: number | null;
    average: number | null;
};
type ReferenceCurrency = {
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
type ReferenceResult = {
    source: string[];
    year: number;
    currencies: Record<string, ReferenceCurrency>;
};
type ArchiveDailyRate = {
    date: string;
    tts: number;
    ttb: number;
    ttm: number;
};
type ArchiveMonthlySummary = {
    month: number;
    high: number | null;
    low: number | null;
    average: number | null;
};
type ArchiveAnnualSummary = {
    high: number | null;
    low: number | null;
    average: number | null;
};
type ArchiveCurrency = {
    unit: number;
    daily: ArchiveDailyRate[];
    monthly: ArchiveMonthlySummary[];
    annual: ArchiveAnnualSummary;
};
type ArchiveResult = {
    /** Source URL supplied by the caller, or null for workbooks of unknown origin. */
    source: string | null;
    year: number;
    currencies: Record<string, ArchiveCurrency>;
};

type XlsInput = ArrayBuffer | ArrayBufferView;

type ParseArchiveWorkbookOptions = {
    sourceUrl?: string;
};
declare const getArchiveSourceUrl: (year: number) => string;
declare const downloadArchiveSource: (year: number, options?: FetchOptions) => Promise<ArrayBuffer>;
declare const parseArchiveWorkbook: (input: XlsInput, options?: ParseArchiveWorkbookOptions) => Promise<ArchiveResult>;

/**
 * Convert between JPY and one foreign currency using an already-fetched
 * `fetchRates()` result. Useful for converting many amounts with one quote.
 */
declare const convertWithRates: (ratesResult: RatesResult, options: ConvertWithRatesOptions) => ConvertWithRatesResult;
declare const convertCurrency: (options: ConvertCurrencyOptions) => Promise<ConvertCurrencyResult | null>;

declare const conversionPurposes: ConversionPurpose[];
/**
 * Returns the rate type (TTS, TTB, or TTM) that Japanese tax rules specify
 * for a conversion purpose. The rules can also require a specific institution's
 * rate, such as the bank holding a deposit; MURC publishes MUFG Bank's rates.
 */
declare const rateTypeForPurpose: (purpose: ConversionPurpose) => ConversionRateType;

/**
 * Fetch daily TTS/TTB/TTM rates for all currencies.
 *
 * If the given date is a weekend or holiday (no published rates), automatically
 * walks back to the nearest preceding business day. This follows the standard
 * practice for Japanese tax filings per NTA guidance (所得税基本通達 57の3-2):
 * https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm
 *
 * The result's `date` field reflects the actual business day used, which may
 * differ from the requested date.
 *
 * Throws a RangeError for dates before 1990-01-01 or after today in Japan.
 */
declare const fetchRates: (date: string | Date, options?: FetchOptions) => Promise<RatesResult | null>;

/**
 * Fetch daily TTS/TTB rates and cash selling/buying rates.
 *
 * If the given date is a weekend or holiday (no published rates), automatically
 * walks back to the nearest preceding business day. This follows the standard
 * practice for Japanese tax filings per NTA guidance (所得税基本通達 57の3-2):
 * https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm
 *
 * The result's `date` field reflects the actual business day used.
 * Call with no date to get today's rates.
 *
 * Throws a RangeError for dates before 2005-09-01 or after today in Japan.
 */
declare const fetchDaily: (date?: string | Date, options?: FetchOptions) => Promise<DailyResult | null>;

/**
 * Fetch month-end rates, monthly averages, and local market rates.
 *
 * Throws a RangeError for invalid months, months before 2005-09, and future months.
 * Returns null when the month has no published data yet.
 */
declare const fetchMonthly: (year: number, month: number, options?: FetchOptions) => Promise<MonthlyResult | null>;

/**
 * Fetch year-end rates and yearly averages.
 *
 * Throws a RangeError for non-integer years, years before 2003, and future years.
 * Returns null when the year has no published data yet.
 */
declare const fetchYearly: (year: number, options?: FetchOptions) => Promise<YearlyResult | null>;

declare const fetchWorld: (options?: FetchOptions) => Promise<WorldResult>;

declare const fetchReference: (year: number, options?: FetchOptions) => Promise<ReferenceResult | null>;

export { conversionPurposes, convertCurrency, convertWithRates, downloadArchiveSource, fetchDaily, fetchMonthly, fetchRates, fetchReference, fetchWorld, fetchYearly, getArchiveSourceUrl, parseArchiveWorkbook, rateTypeForPurpose };
export type { ArchiveAnnualSummary, ArchiveCurrency, ArchiveDailyRate, ArchiveMonthlySummary, ArchiveResult, CashRate, ConversionPurpose, ConversionRateType, ConvertCurrencyOptions, ConvertCurrencyResult, ConvertWithRatesOptions, ConvertWithRatesResult, DailyRate, DailyResult, FetchOptions, LocalMarketRate, MonthlyRate, MonthlyResult, ParseArchiveWorkbookOptions, Rate, RateValues, RatesResult, ReferenceCurrency, ReferenceDailyRate, ReferenceMonthlySummary, ReferenceResult, WorldRate, WorldResult, YearlyRate, YearlyResult };
