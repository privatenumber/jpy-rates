import { F as FetchOptions } from '../fetch-source-Cjzv7wCL.mjs';

type ReferenceRate = {
    code: string | null;
    nameJa: string;
    unit: number;
    /** USD per `unit` currency units; null when the BOJ published a dash (no market rate). */
    usd: number | null;
};
type BasicRatesResult = {
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
     * quote and the basic rate. Currencies without a market quote are omitted.
     * BOJ specifies no rounding; the product is exact to the decimals of its
     * factors, without floating-point noise.
     * BOJ describes these as
     * "市場実勢を基準外国為替相場をもって裁定した相場".
     * https://www.boj.or.jp/about/services/tame/tame_rate/kijun/kiju2611.htm
     */
    arbitrated: Record<string, {
        unit: number;
        rate: number;
    }>;
};
type ReportingRate = {
    code: string;
    /** Number of currency units the rate is quoted for */
    unit: number;
    /** USD per `unit` currency units; null when the BOJ published a dash (no rate). */
    usd: number | null;
};
type ReportingRatesResult = {
    /** URL of the publication the rates were parsed from */
    source: string;
    attribution: string;
    /** Month the rates apply to (YYYY-MM) */
    month: string;
    rates: Record<string, ReportingRate>;
};
/**
 * Tokyo interbank USD/JPY spot rates for one trading day, in JPY per USD.
 * null where the BOJ has no value.
 */
type DailyMarketRate = {
    /** Trading day (YYYY-MM-DD) */
    date: string;
    /** Spot rate at 9:00 JST (FXERD01) */
    at0900: number | null;
    /** Spot rate at 17:00 JST (FXERD04) */
    at1700: number | null;
    /** Central rate (中心相場, FXERD05) */
    center: number | null;
    /** Highest rate of the day (FXERD02) */
    high: number | null;
    /** Lowest rate of the day (FXERD03) */
    low: number | null;
};
type DailyMarketRatesResult = {
    /** BOJ API request the rates were read from */
    source: string;
    attribution: string;
    /** YYYY-MM */
    month: string;
    /** Trading days with published values, in date order */
    days: DailyMarketRate[];
};
/**
 * Monthly summary of Tokyo interbank USD/JPY spot rates, in JPY per USD.
 * null where the BOJ has no value.
 */
type MonthlyMarketRatesResult = {
    source: string;
    attribution: string;
    /** YYYY-MM */
    month: string;
    /**
     * Monthly averages of the 17:00 rate (FXERM07, from 1973)
     * and the central rate (FXERM09, from 1992-08)
     */
    average: {
        at1700: number | null;
        center: number | null;
    };
    /** Month-end 17:00 rate (FXERM06) and central rate (FXERM08) */
    end: {
        at1700: number | null;
        center: number | null;
    };
    /** Highest (FXERM03) and lowest (FXERM05) rates of the month */
    high: number | null;
    low: number | null;
};
type EffectiveRatesResult = {
    source: string;
    attribution: string;
    /** YYYY-MM */
    month: string;
    /** Index base as published, such as "CY 2020=100" */
    base: string;
    /** Nominal effective exchange rate index (FX180110001) */
    nominal: number | null;
    /** Real effective exchange rate index (FX180110002) */
    real: number | null;
};

declare const fetchBasicRates: (year: number, month: number, options?: FetchOptions) => Promise<BasicRatesResult | null>;

declare const fetchReportingRates: (year: number, month: number, options?: FetchOptions) => Promise<ReportingRatesResult | null>;

/**
 * Tokyo interbank USD/JPY spot rates for each trading day of a month, in JPY per USD.
 * Returns null when the BOJ has published no data for the month yet.
 */
declare const fetchDailyMarketRates: (year: number, month: number, options?: FetchOptions) => Promise<DailyMarketRatesResult | null>;
/**
 * Monthly summary of Tokyo interbank USD/JPY spot rates, in JPY per USD.
 * Returns null when the BOJ has not published the month yet.
 */
declare const fetchMonthlyMarketRates: (year: number, month: number, options?: FetchOptions) => Promise<MonthlyMarketRatesResult | null>;

/**
 * The yen's nominal and real effective exchange rate indices for a month.
 * Returns null when the BOJ has published neither index for the month yet.
 */
declare const fetchEffectiveRates: (year: number, month: number, options?: FetchOptions) => Promise<EffectiveRatesResult | null>;

export { FetchOptions, fetchBasicRates, fetchDailyMarketRates, fetchEffectiveRates, fetchMonthlyMarketRates, fetchReportingRates };
export type { BasicRatesResult, DailyMarketRate, DailyMarketRatesResult, EffectiveRatesResult, MonthlyMarketRatesResult, ReferenceRate, ReportingRate, ReportingRatesResult };
