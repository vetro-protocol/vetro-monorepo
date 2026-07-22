// Basis points: 100% expressed as a bigint
const BPS_DENOMINATOR = 10000n;

export const applyBps = (amount: bigint, bps: bigint) =>
  (amount * bps) / BPS_DENOMINATOR;

export const maxBigInt = (...values: bigint[]) =>
  values.reduce((max, v) => (v > max ? v : max));

export const minBigInt = (...values: bigint[]) =>
  values.reduce((min, v) => (v < min ? v : min));
