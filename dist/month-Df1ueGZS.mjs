import { m as monthParts } from './common-BWRtWuj4.mjs';
import { f as fail } from './shared-D2Hs5kU-.mjs';

const parseMonth = (month) => {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return fail("Expected month in YYYY-MM format");
  }
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  try {
    monthParts(year, monthNumber);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
  return [year, monthNumber];
};

export { parseMonth as p };
