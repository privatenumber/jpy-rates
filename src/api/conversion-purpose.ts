import type { ConversionPurpose, ConversionRateType } from './types.ts';

// Rate type that each NTA rule specifies. See notes/murc-rates/tax-rate-selection.md for sources.
const purposeRateTypes: Record<ConversionPurpose, ConversionRateType> = {
	// 所得税基本通達57の3-2: TTM on the transaction date
	general: 'ttm',
	// 措置法通達37の10・37の11共-6: sale proceeds at TTB, acquisition cost at TTS
	'stock-sale': 'ttb',
	'stock-acquisition': 'tts',
	// 措置法通達9の2-2: TTB on the payment start date
	dividend: 'ttb',
	// 財産評価基本通達4-3: assets at TTB, debts at TTS
	'inheritance-asset': 'ttb',
	'inheritance-debt': 'tts',
	// 国外送金等調書法通達5-14: TTB on December 31
	'foreign-asset-report': 'ttb',
};

export const conversionPurposes = Object.keys(purposeRateTypes) as ConversionPurpose[];

/**
 * Returns the rate type (TTS, TTB, or TTM) that Japanese tax rules specify
 * for a conversion purpose. The rules can also require a specific institution's
 * rate, such as the bank holding a deposit; MURC publishes MUFG Bank's rates.
 */
export const rateTypeForPurpose = (purpose: ConversionPurpose): ConversionRateType => {
	if (!Object.hasOwn(purposeRateTypes, purpose)) {
		throw new TypeError(`Invalid purpose: ${purpose} (expected ${conversionPurposes.join(', ')})`);
	}
	return purposeRateTypes[purpose];
};
