import { cli } from 'cleye';

const argv = cli({
  commands: {
    rates: {
      description: "Fetch exchange rates for a date",
      loader: () => import('./rates-BtdaRljs.mjs')
    },
    daily: {
      description: "Fetch daily exchange rates",
      loader: () => import('./daily-_9VjjYDh.mjs')
    },
    convert: {
      description: "Convert between JPY and one foreign currency",
      loader: () => import('./convert-DqVxTaF1.mjs')
    },
    monthly: {
      description: "Fetch monthly exchange rates",
      loader: () => import('./monthly-CSninzyX.mjs')
    },
    yearly: {
      description: "Fetch yearly exchange rates",
      loader: () => import('./yearly-CtE7hlZh.mjs')
    },
    world: {
      description: "Fetch world currency quotations",
      loader: () => import('./world-CAIhImkk.mjs')
    },
    reference: {
      description: "Fetch yearly reference rates",
      loader: () => import('./reference-BCTqO4TK.mjs')
    },
    "download-source": {
      description: "Download the official archive XLS file",
      loader: () => import('./download-source-DghYpR6Q.mjs')
    },
    "parse-archive": {
      description: "Parse a local archive XLS file",
      loader: () => import('./parse-archive-B0avr3nT.mjs')
    }
  }
});
await argv.runCommand();
