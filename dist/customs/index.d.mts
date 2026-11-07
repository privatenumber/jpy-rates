import { F as FetchOptions } from '../fetch-source-Cjzv7wCL.mjs';

type CustomsRate = {
    /** ISO 4217 code */
    code: string;
    /** Country or territory labels exactly as published, including abbreviations. */
    countries: string[];
    currencyJa: string;
    /** ISO code whose published rate was used for an equivalent currency. */
    equivalentTo: string | null;
    /** Number of currency units the rate is quoted for (1 or 100) */
    unit: number;
    /** JPY per `unit` currency units */
    rate: number;
};
type CustomsRatesResult = {
    /** URL of the weekly PDF the rates were parsed from */
    source: string;
    /** Credit required by PDL1.0 */
    attribution: string;
    /** Period the rates apply to (YYYY-MM-DD, inclusive) */
    period: {
        start: string;
        end: string;
    };
    rates: Record<string, CustomsRate>;
};

declare const fetchCustomsRates: (date: string | Date, options?: FetchOptions) => Promise<CustomsRatesResult | null>;

export { FetchOptions, fetchCustomsRates };
export type { CustomsRate, CustomsRatesResult };
