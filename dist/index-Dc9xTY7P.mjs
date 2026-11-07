import { cli } from 'cleye';

const argv = cli({
  commands: {
    basic: {
      description: "Fetch basic and cross rates",
      loader: () => import('./basic-C7TaNqs3.mjs')
    },
    reporting: {
      description: "Fetch reporting ordinance rates",
      loader: () => import('./reporting-C6eqrLkJ.mjs')
    },
    market: {
      description: "Fetch Tokyo interbank USD/JPY spot rates",
      loader: () => import('./market-CJ5ntfRB.mjs')
    },
    effective: {
      description: "Fetch the yen's effective exchange rate indices",
      loader: () => import('./effective-BT-jfrib.mjs')
    }
  }
});
await argv.runCommand();
