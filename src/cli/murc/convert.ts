import { cli } from 'cleye';
import { convertCurrency } from '../../murc/convert-currency.ts';
import { conversionPurposes } from '../../murc/conversion-purpose.ts';
import type { ConversionPurpose, ConversionRateType } from '../../murc/types.ts';
import { jsonFlag } from '../flags.ts';
import {
	exitOnError, fail, requireResult, style,
} from '../shared.ts';
import { formatConversion } from './format.ts';

const requireFlag = <T>(
	value: T,
	name: string,
): Exclude<T, undefined> => {
	if (value === undefined) {
		fail(`Missing required flag: --${name}`);
	}
	if (typeof value === 'string' && value === '') {
		fail(`Missing required flag: --${name}`);
	}
	return value as Exclude<T, undefined>;
};

const parseConversionRate = (rate: string | undefined): ConversionRateType | undefined => {
	if (rate === undefined) {
		return undefined;
	}

	const normalized = rate.toLowerCase();
	if (normalized === 'tts' || normalized === 'ttb' || normalized === 'ttm') {
		return normalized;
	}

	return fail(`Invalid rate: ${rate} (expected tts, ttb, or ttm)`);
};

const argv = cli({
	flags: {
		amount: {
			type: Number,
			alias: 'a',
			description: 'Amount to convert',
		},
		from: {
			type: String,
			alias: 'f',
			description: 'Source currency code',
		},
		to: {
			type: String,
			alias: 't',
			description: 'Target currency code',
		},
		date: {
			type: String,
			alias: 'd',
			description: 'Conversion date (YYYY-MM-DD)',
		},
		rate: {
			type: String,
			alias: 'r',
			description: 'Rate type: tts, ttb, or ttm',
		},
		purpose: {
			type: String,
			alias: 'p',
			description: `Pick the rate type tax rules specify: ${conversionPurposes.join(', ')}`,
		},
		json: jsonFlag,
	},
});

const result = requireResult(
	await exitOnError(convertCurrency({
		amount: requireFlag(argv.flags.amount, 'amount'),
		from: requireFlag(argv.flags.from, 'from'),
		to: requireFlag(argv.flags.to, 'to'),
		date: requireFlag(argv.flags.date, 'date'),
		rate: parseConversionRate(argv.flags.rate),
		purpose: argv.flags.purpose as ConversionPurpose | undefined,
	})),
	'No rates found for this date (non-business day or out of range)',
);
if (argv.flags.json) {
	console.log(JSON.stringify(result));
} else {
	console.log(formatConversion(result, style));
}
