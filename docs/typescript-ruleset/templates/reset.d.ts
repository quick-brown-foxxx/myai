// Safety-only subset of @total-typescript/ts-reset.
// The full `recommended` preset is intentionally NOT used: it is unsound
// (filter(Boolean) hides real errors; literal widening removes genuine TS2345s).
// These entries only turn `any` into `unknown` at common boundaries.
import '@total-typescript/ts-reset/json-parse';
import '@total-typescript/ts-reset/fetch';
import '@total-typescript/ts-reset/promise-catch';
import '@total-typescript/ts-reset/map-constructor';
import '@total-typescript/ts-reset/is-array';
