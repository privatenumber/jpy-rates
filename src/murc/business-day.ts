import { findPrecedingBusinessDay, formatDate, getTodayInJapan } from '../utils/date.ts';

/**
 * Returns the rates for `date`, or for the nearest earlier business day when
 * `date` has none, as 所得税基本通達57の3-2 注3 allows.
 *
 * MURC answers holidays and days it has not published yet with the same
 * redirect. Weekends never have rates, so walking back from them is safe. A
 * weekday that is today in Japan most likely has rates that are not published
 * yet (MURC updates after about 11:00 JST). Walking back there would silently
 * apply another day's rate, so it throws instead.
 */
export const findRatesOnOrBefore = async <T>(
	date: Date,
	fetchForDate: (date: Date) => Promise<T | null>,
	today: Date = getTodayInJapan(),
): Promise<T | null> => {
	const weekday = date.getUTCDay();
	if (formatDate(date) !== formatDate(today) || weekday === 0 || weekday === 6) {
		return findPrecedingBusinessDay(date, fetchForDate);
	}
	const result = await fetchForDate(date);
	if (result) { return result; }
	throw new Error(`MURC has not published rates for today (${formatDate(date)}) yet. Rates are updated after about 11:00 JST. If today is a bank holiday, pass the previous business day.`);
};
