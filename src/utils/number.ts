// Decimal places in the shortest representation of a finite number, such as 2
// for 157.73 and 13 for 1.5773e-9.
const decimalPlaces = (value: number): number => {
	const [mantissa = '', exponent] = String(value).split('e');
	const fraction = mantissa.split('.')[1]?.length ?? 0;
	return exponent === undefined ? fraction : Math.max(0, fraction - Number(exponent));
};

// toFixed accepts at most 100 digits
const maxDecimalPlaces = 100;

/**
 * Multiplies decimal values and removes binary floating-point noise, such as
 * 100 * 157.73 = 15772.999999999998. The exact product of decimals has as many
 * decimal places as its factors combined, so rounding to that scale keeps every
 * digit a double can hold. Rounding to a fixed number of significant digits
 * instead would discard digits of large amounts.
 */
export const multiplyDecimals = (...factors: number[]): number => {
	const product = factors.reduce((result, factor) => result * factor, 1);
	const places = factors.reduce((sum, factor) => sum + decimalPlaces(factor), 0);
	return Number.isFinite(product) && places <= maxDecimalPlaces
		? Number(product.toFixed(places))
		: product;
};
