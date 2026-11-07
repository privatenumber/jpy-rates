import { cli } from 'cleye';
import { a as guideTopics, g as getGuideTopic } from './topics-BalsNTso.mjs';
import { j as jsonFlag } from './flags-cRSEqXfq.mjs';
import { f as formatTable } from './format-table-CEOACGRX.mjs';
import { f as fail, s as style } from './shared-D2Hs5kU-.mjs';
import 'string-width';
import 'ansis';

const formatTopicList = () => [
  style.bold("Which official rate applies?"),
  "",
  formatTable(
    [
      { header: "Topic" },
      { header: "Rate" },
      { header: "Source" },
      { header: "Use for" }
    ],
    guideTopics.map((topic) => [
      style.bold(topic.id),
      topic.rate.replace(/ \(.*\)$/, ""),
      topic.source,
      topic.title
    ]),
    style
  ),
  "",
  style.dim("Run `jpy-rates guide <topic>` for the rule text and the command to fetch the rate.")
].join("\n");
const formatTopic = (topic) => {
  const lines = [
    `${style.bold(topic.title)} ${style.dim(`(${topic.titleJa})`)}`,
    "",
    ...[
      ["Rate:", topic.rate],
      ["Date:", topic.date],
      ["Institution:", topic.institution],
      ["Source:", topic.source]
    ].map(([label, value]) => `${style.dim(label.padEnd(13))}${value}`)
  ];
  for (const rule of topic.rules) {
    lines.push("", style.bold(rule.name), style.dim(rule.url));
    for (const excerpt of rule.excerpts) {
      lines.push(`  \u300C${excerpt}\u300D`);
    }
  }
  if (topic.notes.length > 0) {
    lines.push("", style.bold("Notes"));
    for (const note of topic.notes) {
      lines.push(`  - ${note}`);
    }
  }
  lines.push("", style.bold("Fetch the rate"), `  ${topic.command}`);
  if (topic.source === "murc") {
    lines.push(style.dim("  This fetches MUFG Bank's rate. If the institution above publishes its own rate, use that rate when it differs."));
  }
  return lines.join("\n");
};
const argv = cli({
  parameters: ["[topic]"],
  flags: {
    json: jsonFlag
  },
  help: {
    description: "Show which official rate applies to a tax or reporting purpose, with the rule text"
  }
});
const topicId = argv._.topic;
if (topicId === void 0) {
  console.log(argv.flags.json ? JSON.stringify(guideTopics) : formatTopicList());
} else {
  const topic = getGuideTopic(topicId.trim().toLowerCase()) ?? fail(`Unknown topic: ${topicId} (expected ${guideTopics.map((entry) => entry.id).join(", ")})`);
  console.log(argv.flags.json ? JSON.stringify(topic) : formatTopic(topic));
}
