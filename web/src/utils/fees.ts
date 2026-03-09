export const sumFees = function (fees: (bigint | undefined)[]) {
  if (fees.every((fee): fee is bigint => fee !== undefined)) {
    return fees.reduce((sum, fee) => sum + fee, 0n);
  }
  return undefined;
};
