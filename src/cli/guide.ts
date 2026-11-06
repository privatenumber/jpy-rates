import { cli } from 'cleye';
import { guideTopics, getGuideTopic, type GuideTopic } from '../guide/topics.ts';
import { jsonFlag } from './flags.ts';
import { formatTable } from './format-table.ts';
import { fail, style } from './shared.ts';

const formatTopicList = (): string => [
	style.bold('Which official rate applies?'),
	'',
	formatTable(
		[
			{ header: 'Topic' },
			{ header: 'Rate' },
			{ header: 'Source' },
			{ header: 'Use for' },
		],
		guideTopics.map(topic => [
			style.bold(topic.id),
			topic.rate.replace(/ \(.*\)$/, ''),
			topic.source,
			topic.title,
		]),
		style,
	),
	'',
	style.dim('Run `jpy-rates guide <topic>` for the rule text and the command to fetch the rate.'),
].join('\n');

const formatTopic = (topic: GuideTopic): string => {
	const lines = [
		`${style.bold(topic.title)} ${style.dim(`(${topic.titleJa})`)}`,
		'',
		`${style.dim('Rate:       ')}${topic.rate}`,
		`${style.dim('Date:       ')}${topic.date}`,
		`${style.dim('Institution:')} ${topic.institution}`,
		`${style.dim('Source:     ')}${topic.source}`,
	];

	for (const rule of topic.rules) {
		lines.push('', style.bold(rule.name), style.dim(rule.url));
		for (const excerpt of rule.excerpts) {
			lines.push(`  「${excerpt}」`);
		}
	}

	if (topic.notes.length > 0) {
		lines.push('', style.bold('Notes'));
		for (const note of topic.notes) {
			lines.push(`  - ${note}`);
		}
	}

	lines.push('', style.bold('Fetch the rate'), `  ${topic.command}`);
	return lines.join('\n');
};

const argv = cli({
	parameters: ['[topic]'],
	flags: {
		json: jsonFlag,
	},
	help: {
		description: 'Show which official rate applies to a tax or reporting purpose, with the rule text',
	},
});

const topicId = argv._.topic;
if (topicId === undefined) {
	console.log(argv.flags.json ? JSON.stringify(guideTopics) : formatTopicList());
} else {
	const topic = getGuideTopic(topicId) ?? fail(`Unknown topic: ${topicId} (expected ${guideTopics.map(entry => entry.id).join(', ')})`);
	console.log(argv.flags.json ? JSON.stringify(topic) : formatTopic(topic));
}
