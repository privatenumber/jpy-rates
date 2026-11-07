const decimalPlaces = (value) => {
  const [mantissa = "", exponent] = String(value).split("e");
  const fraction = mantissa.split(".")[1]?.length ?? 0;
  return exponent === void 0 ? fraction : Math.max(0, fraction - Number(exponent));
};
const maxDecimalPlaces = 100;
const multiplyDecimals = (...factors) => {
  const product = factors.reduce((result, factor) => result * factor, 1);
  const places = factors.reduce((sum, factor) => sum + decimalPlaces(factor), 0);
  return Number.isFinite(product) && places <= maxDecimalPlaces ? Number(product.toFixed(places)) : product;
};

export { multiplyDecimals as m };
