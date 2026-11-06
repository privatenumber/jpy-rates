import type { Ansis } from 'ansis';
import type { BasicRatesResult, ReportingRatesResult } from '../../boj/types.ts';
import { formatTable } from '../format-table.ts';

export const formatBasic = (result: BasicRatesResult, style: Ansis, showBasic = true): string => {
	const entries = [
		...(showBasic ? [['USD', 1, result.basic, 'basic'] as const] : []),
		...Object.entries(result.cross).map(([code, rate]) => [code, 1, rate, 'cross'] as const),
		...Object.entries(result.arbitrated).map(([code, quote]) => [code, quote.unit, quote.rate, 'derived'] as const),
	];
	const rows = entries.map(([code, unit, rate, basis]) => [
		unit === 1 ? code : `${code}*`, String(unit), String(rate), basis,
	]);
	const sections = [
		style.bold(`BOJ basic and cross rates ${result.month}`),
		`Reference market month: ${result.referenceMonth}`,
		'',
		formatTable([{ header: 'Currency' }, {
			header: 'Units',
			align: 'right',
		}, {
			header: 'JPY',
			align: 'right',
		}, { header: 'Basis' }], rows, style),
	];
	if (entries.some(([, unit]) => unit !== 1)) { sections.push(style.dim('* Rate is per stated units.')); }
	sections.push(style.dim('Derived rows are USD market rate × basic rate.'), '', `Source: ${result.source}`, result.attribution);
	return sections.join('\n');
};

export const formatReporting = (result: ReportingRatesResult, style: Ansis): string => {
	const rows = Object.values(result.rates).map(({ code, unit, usd }) => [
		code, String(unit), String(usd),
	]);
	return [
		style.bold(`BOJ reporting rates ${result.month}`),
		'',
		formatTable([{ header: 'Currency' }, {
			header: 'Units',
			align: 'right',
		}, {
			header: 'USD',
			align: 'right',
		}], rows, style),
		style.dim('These rates convert amounts to USD for reports.'),
		'',
		`Source: ${result.source}`,
		result.attribution,
	].join('\n');
};
