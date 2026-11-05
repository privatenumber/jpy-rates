import ansis, { Ansis } from 'ansis';

// ansis detects NO_COLOR and FORCE_COLOR, but also enables color for non-TTY
// output when COLORTERM is set. Keep piped output plain unless FORCE_COLOR asks otherwise.
export const style = new Ansis(
	process.env.FORCE_COLOR !== undefined || process.stdout.isTTY
		? ansis.level
		: 0,
);

export const fail = (message: string): never => {
	console.error(message);
	process.exit(1);
	throw new Error(message);
};

export const exitOnError = async <T>(operation: Promise<T>): Promise<T> => {
	try {
		return await operation;
	} catch (error) {
		return fail(error instanceof Error ? error.message : String(error));
	}
};

export const requireResult = <T>(
	value: T,
	message: string,
): NonNullable<T> => {
	if (value === null || value === undefined) {
		fail(message);
	}
	return value as NonNullable<T>;
};

export const normalizeCurrency = (currency: string): string => currency.trim().toUpperCase();

// Returns only the entry for `currency`, or an empty record when it is absent
export const pickCurrency = <T>(
	rates: Record<string, T>,
	currency: string,
): Record<string, T> => (
	Object.hasOwn(rates, currency)
		? { [currency]: rates[currency]! }
		: {}
);

export const filterCurrency = <T>(
	rates: Record<string, T>,
	currency: string,
): Record<string, T> => {
	const filtered = pickCurrency(rates, currency);
	if (Object.keys(filtered).length === 0) {
		fail(`Currency ${currency} not found in results`);
	}
	return filtered;
};
