import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { cli } from 'cleye';
import { p as parseArchiveWorkbook } from './archive-CGyOiln5.mjs';
import { j as jsonFlag } from './flags-cRSEqXfq.mjs';
import { e as exitOnError, s as style } from './shared-D2Hs5kU-.mjs';
import { h as formatArchive } from './format-DQugMBKY.mjs';
import './fetch-source-BHAj9IoI.mjs';
import 'node:timers/promises';
import './parse-xls-ZcOCCVSl.mjs';
import 'node:crypto';
import 'xlsx';
import 'ansis';
import './format-table-CEOACGRX.mjs';
import 'string-width';

const argv = cli({
  parameters: ["<file>"],
  flags: {
    json: jsonFlag
  }
});
const xlsBuffer = await exitOnError(readFile(argv._.file));
const result = await exitOnError(parseArchiveWorkbook(xlsBuffer, {
  sourceUrl: pathToFileURL(path.resolve(argv._.file)).href
}));
if (argv.flags.json) {
  console.log(JSON.stringify(result));
} else {
  console.log(formatArchive(result, style));
}
