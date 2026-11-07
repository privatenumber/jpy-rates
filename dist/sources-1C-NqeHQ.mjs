import { cli } from 'cleye';
import { r as rateSources } from './sources-DwUUADTL.mjs';
import { j as jsonFlag } from './flags-cRSEqXfq.mjs';
import { s as style } from './shared-D2Hs5kU-.mjs';
import 'ansis';

const argv = cli({
  flags: {
    json: jsonFlag
  },
  help: {
    description: "List the supported rate sources, what they provide, and their terms of use"
  }
});
if (argv.flags.json) {
  console.log(JSON.stringify(rateSources));
} else {
  const sections = rateSources.map((source) => [
    `${style.bold(source.id)}  ${source.name}`,
    `  ${style.dim("Publisher:")} ${source.publisher}`,
    `  ${style.dim("Provides: ")} ${source.provides}`,
    `  ${style.dim("Coverage: ")} ${source.coverage}`,
    `  ${style.dim("URL:      ")} ${source.url}`,
    `  ${style.dim("Terms:    ")} ${source.terms.summary}`,
    `  ${style.dim("          ")} ${source.terms.url}`
  ].join("\n"));
  console.log(sections.join("\n\n"));
}
