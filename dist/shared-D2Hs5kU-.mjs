import ansis from 'ansis';

const style = ansis;
const fail = (message) => {
  console.error(message);
  process.exit(1);
  throw new Error(message);
};
const exitOnError = async (operation) => {
  try {
    return await operation;
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
};
const requireResult = (value, message) => {
  if (value === null || value === void 0) {
    fail(message);
  }
  return value;
};
const normalizeCurrency = (currency) => currency.trim().toUpperCase();
const pickCurrency = (rates, currency) => Object.hasOwn(rates, currency) ? { [currency]: rates[currency] } : {};
const filterCurrency = (rates, currency) => {
  const filtered = pickCurrency(rates, currency);
  if (Object.keys(filtered).length === 0) {
    fail(`Currency ${currency} not found in results`);
  }
  return filtered;
};

export { filterCurrency as a, exitOnError as e, fail as f, normalizeCurrency as n, pickCurrency as p, requireResult as r, style as s };
