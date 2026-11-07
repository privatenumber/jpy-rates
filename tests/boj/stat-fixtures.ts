// Synthetic BOJ Time-Series Data Search API responses. No source values are stored.
const endpoint = 'https://www.stat-search.boj.or.jp/api/v1/getDataCode';

// Lets a test abort after the response arrives and before its body fails
export const stalledBody = {
	requested: Promise.withResolvers<void>(),
	release: Promise.withResolvers<void>(),
};

const json = (body: unknown, status = 200) => Response.json(body, {
	status,
	headers: { 'content-type': 'application/json; charset=utf-8' },
});

type ValueOf = (code: string, index: number) => number | null;

const resultSet = (codes: string[], dates: number[], values: ValueOf, unit = 'Yen per U.S. Dollar') => codes.map(code => ({
	SERIES_CODE: code,
	UNIT: unit,
	VALUES: {
		SURVEY_DATES: dates,
		VALUES: dates.map((_, index) => values(code, index)),
	},
}));

const ok = (codes: string[], dates: number[], values: ValueOf, unit?: string) => json({
	STATUS: 200,
	MESSAGEID: 'M181000I',
	MESSAGE: '正常に終了しました。',
	RESULTSET: resultSet(codes, dates, values, unit),
});

const noData = (codes: string[], dates: number[]) => json({
	STATUS: 200,
	MESSAGEID: 'M181030I',
	MESSAGE: '正常に終了しましたが、該当データはありませんでした。',
	RESULTSET: resultSet(codes, dates, () => null),
});

// Daily values: 2026-10-01 and 2026-10-02 are trading days, 2026-10-03 is not
const dailyValue = (code: string, index: number) => (
	index === 2 ? null : 100 + Number(code.slice(-1)) + (index / 10)
);

export const statFixture = (url: string): Response | undefined => {
	if (!url.startsWith(endpoint)) { return undefined; }
	const parameters = new URL(url).searchParams;
	const codes = parameters.get('code')!.split(',');
	const key = `${parameters.get('db')} ${codes[0]!.slice(0, 5)} ${parameters.get('startDate')}`;
	switch (key) {
		case 'FM08 FXERD 202610': { return ok(codes, [20_261_001, 20_261_002, 20_261_003], dailyValue); }
		case 'FM08 FXERD 202612': { return noData(codes, [20_261_201, 20_261_202]); }
		case 'FM08 FXERM 202610': { return ok(codes, [202_610], code => 110 + Number(code.slice(-1))); }
		// Months before 1992-08 only have the 17:00 series
		case 'FM08 FXERM 198001': { return ok(codes, [198_001], code => (code === 'FXERM06' || code === 'FXERM07' ? 200 : null)); }
		// The current month is listed without values
		case 'FM08 FXERM 202611': { return ok(codes, [202_611], () => null); }
		case 'FM09 FX180 202609': { return ok(codes, [202_609], code => (code.endsWith('1') ? 70 : 65), 'CY 2020=100'); }
		// Malformed responses
		case 'FM09 FX180 202601': { return ok(codes, [202_601], () => '70.1' as unknown as number); }
		case 'FM09 FX180 202602': {
			return json({
				STATUS: 200,
				MESSAGEID: 'M181000I',
				RESULTSET: codes.map(code => ({ SERIES_CODE: code })),
			});
		}
		case 'FM09 FX180 202603': { return ok(codes, [202_602], () => 70); }
		// The body fails while it is read, but only after the test releases it
		case 'FM09 FX180 202604': {
			stalledBody.requested.resolve();
			return new Response(new ReadableStream({
				async pull(controller) {
					await stalledBody.release.promise;
					controller.error(new Error('body read failed'));
				},
			}));
		}
		// Dates out of order
		case 'FM08 FXERD 202609': { return ok(codes, [20_260_902, 20_260_901], () => 100); }
		case 'FM09 FX180 197001': {
			return json({
				STATUS: 400,
				MESSAGEID: 'M181013E',
				MESSAGE: 'Nonexistent series code：1',
			}, 400);
		}
		default: { throw new Error(`[stat-fixture] No synthetic fixture for ${key}`); }
	}
};
