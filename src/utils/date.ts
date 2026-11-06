// Calendar dates are represented as Dates at UTC midnight so that every
// calculation is independent of the host timezone.
export const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

export const addDays = (date: Date, days: number): Date => {
	const result = new Date(date);
	result.setUTCDate(result.getUTCDate() + days);
	return result;
};

const japanOffsetMilliseconds = 9 * 60 * 60 * 1000;

// The source publishes on Japan time, so "today" is the current calendar date in JST.
export const getTodayInJapan = (): Date => parseDate(
	formatDate(new Date(Date.now() + japanOffsetMilliseconds)),
);

const isMidnightLocal = (date: Date) => date.getHours() === 0
	&& date.getMinutes() === 0
	&& date.getSeconds() === 0
	&& date.getMilliseconds() === 0;

const isMidnightUtc = (date: Date) => date.getUTCHours() === 0
	&& date.getUTCMinutes() === 0
	&& date.getUTCSeconds() === 0
	&& date.getUTCMilliseconds() === 0;

// Returns a UTC-midnight Date representing the calendar date.
//
// Date in JS is an instant, not a calendar date. Two common constructors
// produce different instants for the same calendar date:
//   new Date(2025, 0, 6)   → local midnight Jan 6
//   new Date('2025-01-06') → UTC midnight Jan 6
//
// We detect which one the caller used:
//   local midnight → read local fields (getFullYear/getMonth/getDate)
//   UTC midnight   → read UTC fields (getUTCFullYear/getUTCMonth/getUTCDate)
//   neither        → reject as ambiguous
export const parseDate = (input: string | Date): Date => {
	if (input instanceof Date) {
		if (Number.isNaN(input.getTime())) {
			throw new TypeError('Invalid Date');
		}

		if (isMidnightLocal(input)) {
			return new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()));
		}

		if (isMidnightUtc(input)) {
			return new Date(input);
		}

		throw new Error(
			'Ambiguous Date input — cannot determine calendar date. '
			+ 'Pass a YYYY-MM-DD string, new Date(year, month, day), or new Date(\'YYYY-MM-DD\').',
		);
	}

	const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) { throw new Error(`Invalid date format: ${input} (expected YYYY-MM-DD)`); }
	const [, ys, ms, ds] = match;
	const date = new Date(Date.UTC(Number(ys), Number(ms) - 1, Number(ds)));
	if (formatDate(date) !== input) {
		throw new Error(`Invalid date: ${input}`);
	}
	return date;
};

// Throws when a calendar date is outside the range the source can serve.
export const assertDateInRange = (date: Date, earliest: string): void => {
	const dateString = formatDate(date);
	if (dateString < earliest) {
		throw new RangeError(`Date ${dateString} is before the earliest available date ${earliest}`);
	}
	const today = formatDate(getTodayInJapan());
	if (dateString > today) {
		throw new RangeError(`Date ${dateString} is in the future (today in Japan is ${today})`);
	}
};

// Walks back from `date` until `fetchForDate` returns a result.
//
// The longest closure is the 2019 Golden Week holiday (Apr 27 – May 6, ten days),
// so 14 days covers every known gap with margin.
const maxWalkbackDays = 14;

export const findPrecedingBusinessDay = async <T>(
	date: Date,
	fetchForDate: (date: Date) => Promise<T | null>,
): Promise<T | null> => {
	for (let attempt = 0; attempt < maxWalkbackDays; attempt += 1) {
		const result = await fetchForDate(addDays(date, -attempt));
		if (result) { return result; }
	}
	return null;
};
