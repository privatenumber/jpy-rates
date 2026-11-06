import { createFixtureFetch } from './fixture-fetch.ts';

// Loaded with `node --import` so CLI subprocesses use offline fixtures
globalThis.fetch = createFixtureFetch();
