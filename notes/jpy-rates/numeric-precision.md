# Numeric precision of converted amounts

## Conclusion

Conversions to JPY and BOJ derived rates use `multiplyDecimals` ([`src/utils/number.ts`](../../src/utils/number.ts)): multiply, then round to the combined decimal places of the factors. The exact product of decimals has exactly that many decimal places, so the rounding removes binary floating-point noise (`100 × 157.73 = 15772.999999999998` becomes `15773`) and never removes a digit the exact result has. Conversions from JPY divide by the rate and are not normalized; the quotient has no finite decimal scale.

## Evidence

Experiment on 2026-11-07, Node 24.14.0: random amounts from 0 to 10^12 with 0 to 4 decimals, rates from 0 to 300 with 0 to 4 decimals, unit 1 or 100. The exact product was computed with BigInt on the decimal strings.

| Method | Not equal to the exact product | Off by 0.005 or more |
| --- | --- | --- |
| Raw `a * b` (200,000 cases, 2-decimal inputs) | 68,182 | 0 |
| `toPrecision(12)`, used until 2026-11-07 | 79,752 | 50,570 |
| `toPrecision(15)` | 30,205 | 4,415 |
| Round to the factors' decimal places (300,000 cases) | 13,379 | 0 |

- The remaining mismatches are products with more digits than a double holds. The largest error was 1.81 ulp of the exact value (`42343103.89 × 112.0642`), below the precision of the result type.
- Cost: about 0.7 µs per call (1e6 calls in 733 ms), negligible next to a network request.

## Rejected alternatives

- A fixed number of significant digits (12 or 15) rounds away real digits of large amounts. A code review found the 12-digit version turned 10,000,000,000.01 USD × 157.73 into 1,577,300,000,000 JPY instead of 1,577,300,000,001.5773.
- A decimal library or BigInt arithmetic in the API would return exact strings, but every caller would need to handle a non-number type. Revisit if a consumer needs exact results beyond 15 to 17 significant digits.
