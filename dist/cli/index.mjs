#!/usr/bin/env node
import { cli } from 'cleye';

const argv = cli({
  name: "jpy-rates",
  strictFlags: true,
  commands: {
    guide: {
      description: "Show which official rate applies to a tax or reporting purpose",
      loader: () => import('../guide-B6H0E7Or.mjs')
    },
    sources: {
      description: "List the supported rate sources and their terms",
      loader: () => import('../sources-1C-NqeHQ.mjs')
    },
    murc: {
      description: "MUFG Bank customer rates published by MURC (TTS/TTB/TTM)",
      loader: () => import('../index-BLnUkbUZ.mjs')
    },
    customs: {
      description: "Japan Customs weekly rates for import valuation",
      loader: () => import('../index-D3Cuh5XR.mjs')
    },
    boj: {
      description: "Bank of Japan rates designated for foreign exchange reports",
      loader: () => import('../index-Dc9xTY7P.mjs')
    }
  }
});
await argv.runCommand();
