const BPS_DENOMINATOR = 10000n;

export const applyBps = (amount: bigint, bps: bigint) =>
  (amount * bps) / BPS_DENOMINATOR;

export const sumFees = function (fees: (bigint | undefined)[]) {
  if (fees.every((fee): fee is bigint => fee !== undefined)) {
    return fees.reduce((sum, fee) => sum + fee, 0n);
  }
  return undefined;
};
