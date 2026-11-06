import { formatDate } from '../utils/date.ts';

export const parseUnit = (text: string): number => {
	const trimmed = text.trim();
	if (trimmed === '100unit') { return 100; }
	return 1;
};

export const cleanCellText = (text: string): string => text.replace(/[*＊\s]+$/u, '').trim();

export const computeTtm = (tts: number | null, ttb: number | null): number | null => {
	if (tts === null || ttb === null) { return null; }
	return Math.round(((tts + ttb) / 2) * 100) / 100;
};

// Accepts plain decimals and comma-grouped thousands (e.g. "9,720").
// Anything else, such as "unquoted" or annotated values, is not a rate.
const ratePattern = /^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/;

export const parseRate = (text: string): number | null => {
	const trimmed = text.trim();
	if (!ratePattern.test(trimmed)) { return null; }
	return Number(trimmed.replaceAll(',', ''));
};

// MURC page IDs use two-digit years (YYMMDD)
export const formatDateId = (date: Date): string => formatDate(date).slice(2).replaceAll('-', '');
