// Removes binary floating-point noise from a computed value, such as
// 100 * 157.73 = 15772.999999999998, without imposing a rounding policy.
export const normalizeFloat = (value: number): number => Number(value.toPrecision(12));
