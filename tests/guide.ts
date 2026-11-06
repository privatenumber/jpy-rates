import { describe, test, expect } from 'manten';
import spawn from 'nano-spawn';
import { guideTopics, getGuideTopic } from '../src/guide/topics.ts';
import { rateSources } from '../src/guide/sources.ts';
import { conversionPurposes } from '../src/murc/conversion-purpose.ts';

const cli = async (arguments_: string[]) => {
	const result = await spawn(process.execPath, ['src/cli/index.ts', ...arguments_]);
	return result.stdout;
};

describe('guide', () => {
	test('every topic cites a rule with excerpts and points to a known source', () => {
		const sourceIds = new Set(rateSources.map(source => source.id));
		const topicIds = new Set<string>();
		for (const topic of guideTopics) {
			expect(topicIds.has(topic.id)).toBe(false);
			topicIds.add(topic.id);
			expect(sourceIds.has(topic.source)).toBe(true);
			expect(topic.rules.length).toBeGreaterThan(0);
			for (const rule of topic.rules) {
				expect(rule.url).toMatch(/^https:\/\//);
				expect(rule.excerpts.length).toBeGreaterThan(0);
			}
			expect(topic.command.startsWith(`jpy-rates ${topic.source} `)).toBe(true);
		}
	});

	test('MURC commands use purposes that convertCurrency accepts', () => {
		for (const topic of guideTopics) {
			const purpose = topic.command.match(/ -p (\S+)/)?.[1];
			if (purpose) {
				expect(conversionPurposes).toContain(purpose);
			}
		}
	});

	test('getGuideTopic finds topics by id', () => {
		expect(getGuideTopic('stock-sale')?.rate).toBe('TTB');
		expect(getGuideTopic('import')?.source).toBe('customs');
		expect(getGuideTopic('unknown')).toBeUndefined();
	});

	test('CLI lists topics and shows rule text for one topic', async () => {
		const list = await cli(['guide']);
		expect(list).toContain('stock-sale');
		expect(list).toContain('foreign-asset-report');

		const topic = await cli(['guide', 'stock-sale']);
		expect(topic).toContain('措置法通達37の10・37の11共-6');
		expect(topic).toContain('対顧客直物電信買相場');
		expect(topic).toContain('jpy-rates murc convert');

		const json = JSON.parse(await cli(['guide', 'import', '--json']));
		expect(json.source).toBe('customs');
	});

	test('CLI rejects unknown topics', async () => {
		const result = await spawn(process.execPath, ['src/cli/index.ts', 'guide', 'nope']).catch(error => error);
		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain('Unknown topic: nope');
	});

	test('CLI lists sources with terms', async () => {
		const output = await cli(['sources']);
		for (const source of rateSources) {
			expect(output).toContain(source.terms.url);
		}
	});
});
