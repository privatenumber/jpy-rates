const currencyFlag = {
  type: String,
  alias: "c",
  description: "Filter output to a single currency code"
};
const jsonFlag = {
  type: Boolean,
  description: "Output as compact JSON"
};

export { currencyFlag as c, jsonFlag as j };
