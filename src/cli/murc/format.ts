import type { Ansis } from 'ansis';
import type {
	RateValues, RatesResult, DailyResult, MonthlyResult, YearlyResult, WorldResult,
	ReferenceResult, ArchiveResult, ConvertCurrencyResult,
} from '../../murc/types.ts';
import { formatTable } from '../format-table.ts';

const fmtRate = (style: Ansis, value: number | null, decimals = 2): string => (value === null ? style.dim('—') : value.toFixed(decimals));

// Up to 10 decimals for ordinary amounts; amounts below 1 keep 10 significant digits
// so a small nonzero amount is not shown as 0
const numberFormat = new Intl.NumberFormat('en-US', {
	maximumFractionDigits: 10,
});
const smallNumberFormat = new Intl.NumberFormat('en-US', {
	maximumSignificantDigits: 10,
});
const formatAmount = (value: number): string => (
	Math.abs(value) < 1 ? smallNumberFormat.format(value) : numberFormat.format(value)
);

const sourceLine = (source: string | string[]) => `Source: ${Array.isArray(source) ? source.join(', ') : source}`;

const rateColumns = [
	{ header: 'Code' },
	{ header: 'Currency' },
	{
		header: 'TTS',
		align: 'right' as const,
	},
	{
		header: 'TTB',
		align: 'right' as const,
	},
	{
		header: 'TTM',
		align: 'right' as const,
	},
];

type RateEntry = {
	name: string;
	unit: number;
};

const unitFootnote = '* per 100 units';

// Marks per-100-unit quotes (e.g. KRW, IDR) so they are not misread as per-unit rates
const formatRateTable = <T extends RateEntry>(
	rates: Record<string, T>,
	getValues: (rate: T) => RateValues,
	style: Ansis,
): { table: string;
	hasUnitFootnote: boolean; } => {
	let hasUnitFootnote = false;
	const rows = Object.entries(rates).map(([code, rate]) => {
		if (rate.unit === 100) {
			hasUnitFootnote = true;
		}
		const values = getValues(rate);
		return [
			style.bold(rate.unit === 100 ? `${code}*` : code),
			rate.name,
			fmtRate(style, values.tts),
			fmtRate(style, values.ttb),
			fmtRate(style, values.ttm),
		];
	});

	return {
		table: formatTable(rateColumns, rows, style),
		hasUnitFootnote,
	};
};

export const formatRates = (result: RatesResult, style: Ansis): string => {
	const { table, hasUnitFootnote } = formatRateTable(result.rates, rate => rate, style);
	const sections = [
		style.bold(result.date),
		'',
		table,
	];
	if (hasUnitFootnote) {
		sections.push('', style.dim(unitFootnote));
	}
	sections.push('', sourceLine(result.source));
	return sections.join('\n');
};

export const formatDaily = (result: DailyResult, style: Ansis): string => {
	const { table, hasUnitFootnote } = formatRateTable(result.rates, rate => rate, style);
	const sections = [
		style.bold(result.date),
		'',
		table,
	];
	if (hasUnitFootnote) {
		sections.push('', style.dim(unitFootnote));
	}

	const cashEntries = Object.entries(result.cashRates);
	if (cashEntries.length > 0) {
		const cashColumns = [
			{ header: 'Code' },
			{
				header: 'Selling',
				align: 'right' as const,
			},
			{
				header: 'Buying',
				align: 'right' as const,
			},
		];
		const cashRows = cashEntries.map(([code, rate]) => [
			style.bold(code),
			rate.selling.toFixed(2),
			rate.buying.toFixed(2),
		]);
		sections.push('', style.dim('Cash Rates'), formatTable(cashColumns, cashRows, style));
	}

	sections.push('', sourceLine(result.source));
	return sections.join('\n');
};

export const formatConversion = (result: ConvertCurrencyResult, style: Ansis): string => {
	const foreignCurrency = result.from === 'JPY'
		? result.to
		: result.from;
	const dateLine = result.requestedDate === result.sourceDate
		? result.sourceDate
		: `${result.requestedDate} -> ${result.sourceDate}`;

	return [
		style.bold(
			`${formatAmount(result.amount)} ${result.from} = ${formatAmount(result.convertedAmount)} ${result.to}`,
		),
		`Rate: ${result.rate.toUpperCase()} ${fmtRate(style, result.rateValue)} JPY per ${result.unit} ${foreignCurrency}${result.purpose ? ` (purpose: ${result.purpose})` : ''}`,
		`Date: ${dateLine}`,
		'Bank: MUFG Bank customer rate, published by MURC',
		`Source: ${result.source}`,
	].join('\n');
};

export const formatMonthly = (result: MonthlyResult, style: Ansis): string => {
	const monthString = `${result.year}-${String(result.month).padStart(2, '0')}`;
	const monthEnd = formatRateTable(result.rates, rate => rate.monthEnd, style);
	const monthlyAverage = formatRateTable(result.rates, rate => rate.monthlyAverage, style);

	const sections = [style.bold(monthString)];
	// Empty when `--currency` selects only a local market rate
	if (Object.keys(result.rates).length > 0) {
		sections.push(
			'',
			style.dim('Month-End'),
			monthEnd.table,
			'',
			style.dim('Monthly Average'),
			monthlyAverage.table,
		);
	}

	if (monthEnd.hasUnitFootnote) {
		sections.push('', style.dim(unitFootnote));
	}

	const localEntries = Object.entries(result.localMarketRates);
	if (localEntries.length > 0) {
		const localColumns = [
			{ header: 'Code' },
			{
				header: 'Selling',
				align: 'right' as const,
			},
			{
				header: 'Buying',
				align: 'right' as const,
			},
			{
				header: 'Rate',
				align: 'right' as const,
			},
			{ header: 'Quote date' },
			{ header: 'Source' },
		];
		const localRows = localEntries.map(([code, rate]) => [
			style.bold(code),
			fmtRate(style, rate.selling, 4),
			fmtRate(style, rate.buying, 4),
			fmtRate(style, rate.rate, 4),
			rate.quoteDate ?? style.dim('—'),
			rate.source,
		]);
		sections.push(
			'',
			style.dim('Local Market Rates (per 1 USD, as quoted in each market)'),
			formatTable(localColumns, localRows, style),
		);
	}

	sections.push('', sourceLine(result.source));

	return sections.join('\n');
};

export const formatYearly = (result: YearlyResult, style: Ansis): string => {
	const yearEnd = formatRateTable(result.rates, rate => rate.yearEnd, style);
	const yearlyAverage = formatRateTable(result.rates, rate => rate.yearlyAverage, style);

	const sections = [
		style.bold(String(result.year)),
		'',
		style.dim('Year-End'),
		yearEnd.table,
		'',
		style.dim('Yearly Average'),
		yearlyAverage.table,
	];

	if (yearEnd.hasUnitFootnote) {
		sections.push('', style.dim(unitFootnote));
	}

	sections.push('', sourceLine(result.source));
	return sections.join('\n');
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatReference = (result: ReferenceResult, style: Ansis): string => {
	const summaryColumns = [
		{ header: 'Month' },
		{
			header: 'High',
			align: 'right' as const,
		},
		{
			header: 'Low',
			align: 'right' as const,
		},
		{
			header: 'Average',
			align: 'right' as const,
		},
	];

	const sections: string[] = [style.bold(String(result.year))];

	for (const [code, currency] of Object.entries(result.currencies)) {
		if (currency.monthlySummary.length === 0) { continue; }

		const rows = currency.monthlySummary.map(summary => [
			monthNames[summary.month - 1],
			fmtRate(style, summary.high, 4),
			fmtRate(style, summary.low, 4),
			fmtRate(style, summary.average, 4),
		]);

		// The summary is read from the per-USD columns when the currency has them
		const basis = currency.rates.perUsd ? 'per 1 USD' : `per ${currency.perJpyUnit ?? 1} JPY`;
		sections.push(
			'',
			style.dim(`${code} (${basis}) — ${currency.sourceJa}`),
			formatTable(summaryColumns, rows, style),
		);
	}

	sections.push('', sourceLine(result.source));
	return sections.join('\n');
};

const regionKeys = ['asia', 'africa', 'europe', 'mideast', 'americas'] as const;

const worldColumns = [
	{ header: 'Country' },
	{ header: 'Code' },
	{ header: 'Official' },
	{ header: 'Market Level' },
];

export const formatWorld = (result: WorldResult, style: Ansis): string => {
	const sections: string[] = [style.bold(result.date)];

	for (const key of regionKeys) {
		const entries = result[key];
		if (entries.length === 0) {
			continue;
		}

		const label = key.charAt(0).toUpperCase() + key.slice(1);
		const rows = entries.map(entry => [
			entry.country,
			entry.code,
			entry.quotation || style.dim('—'),
			entry.marketLevel || style.dim('—'),
		]);

		sections.push(
			'',
			style.dim(`${label} (${entries.length})`),
			formatTable(worldColumns, rows, style),
		);
	}

	sections.push(
		'',
		style.dim('Official (quotations by monetary authorities) and market levels are units of each currency per 1 USD unless noted.'),
		sourceLine(result.source),
	);
	return sections.join('\n');
};

export const formatArchive = (result: ArchiveResult, style: Ansis): string => {
	const columns = [
		{ header: 'Code' },
		{
			header: 'High',
			align: 'right' as const,
		},
		{
			header: 'Low',
			align: 'right' as const,
		},
		{
			header: 'Average',
			align: 'right' as const,
		},
	];

	let hasUnitFootnote = false;
	const rows = Object.entries(result.currencies).map(([code, currency]) => {
		if (currency.unit === 100) {
			hasUnitFootnote = true;
		}
		const { high, low, average } = currency.annual;
		return [
			style.bold(currency.unit === 100 ? `${code}*` : code),
			fmtRate(style, high),
			fmtRate(style, low),
			fmtRate(style, average),
		];
	});

	const sections = [
		style.bold(String(result.year)),
		'',
		formatTable(columns, rows, style),
	];
	if (hasUnitFootnote) {
		sections.push('', style.dim(unitFootnote));
	}
	if (result.source) {
		sections.push('', sourceLine(result.source));
	}
	return sections.join('\n');
};
