import type { Ansis } from 'ansis';
import type {
	BasicRatesResult, DailyMarketRatesResult, EffectiveRatesResult,
	MonthlyMarketRatesResult, ReportingRatesResult,
} from '../../boj/types.ts';
import { formatTable } from '../format-table.ts';

export const formatBasic = (result: BasicRatesResult, style: Ansis, showBasic = true): string => {
	const entries = [
		...(showBasic ? [['USD', 1, result.basic, 'basic'] as const] : []),
		...Object.entries(result.cross).map(([code, rate]) => [code, 1, rate, 'cross'] as const),
		...Object.entries(result.arbitrated).map(([code, quote]) => [code, quote.unit, quote.rate, 'derived'] as const),
		...result.reference
			.filter(row => row.usd === null)
			.map(row => [row.code ?? row.nameJa, row.unit, null, 'no rate published'] as const),
		// A currency name this package cannot map to a code has no derived rate, but stays visible
		...result.reference
			.filter(row => row.code === null && row.usd !== null)
			.map(row => [row.nameJa, row.unit, null, `unmapped name, ${row.usd} USD`] as const),
	];
	const rows = entries.map(([code, unit, rate, basis]) => [
		unit === 1 ? code : `${code}*`, String(unit), rate === null ? style.dim('—') : String(rate), basis,
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
		code, String(unit), usd === null ? style.dim('— (no rate published)') : String(usd),
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

const rateText = (rate: number | null, style: Ansis) => (rate === null ? style.dim('—') : String(rate));

const footer = (result: { source: string;
	attribution: string; }) => ['', `Source: ${result.source}`, result.attribution];

export const formatDailyMarket = (
	result: DailyMarketRatesResult,
	style: Ansis,
	title: string,
): string => [
	style.bold(title),
	'',
	formatTable([
		{ header: 'Date' },
		...['9:00', '17:00', 'Center', 'High', 'Low'].map(header => ({
			header,
			align: 'right' as const,
		})),
	], result.days.map(day => [
		day.date,
		...[day.at0900, day.at1700, day.center, day.high, day.low].map(rate => rateText(rate, style)),
	]), style),
	style.dim('JPY per USD, Tokyo interbank spot market. — means the BOJ has no value.'),
	...footer(result),
].join('\n');

export const formatMonthlyMarket = (result: MonthlyMarketRatesResult, style: Ansis): string => [
	style.bold(`Tokyo market USD/JPY ${result.month}`),
	'',
	formatTable([{ header: '' }, {
		header: '17:00',
		align: 'right',
	}, {
		header: 'Center',
		align: 'right',
	}], [
		['Average', rateText(result.average.at1700, style), rateText(result.average.center, style)],
		['Month end', rateText(result.end.at1700, style), rateText(result.end.center, style)],
	], style),
	`High: ${rateText(result.high, style)}  Low: ${rateText(result.low, style)}`,
	style.dim('JPY per USD, Tokyo interbank spot market. — means the BOJ has no value.'),
	...footer(result),
].join('\n');

export const formatEffective = (result: EffectiveRatesResult, style: Ansis): string => [
	style.bold(`Yen effective exchange rate indices ${result.month}`),
	'',
	formatTable([{ header: 'Index' }, {
		header: result.base,
		align: 'right',
	}], [
		['Nominal', rateText(result.nominal, style)],
		['Real', rateText(result.real, style)],
	], style),
	style.dim('Higher means a stronger yen. — means the BOJ has not published the index.'),
	...footer(result),
].join('\n');
