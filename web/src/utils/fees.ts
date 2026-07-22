import { formatUnits } from "viem";

export const sumFees = function (fees: (bigint | undefined)[]) {
  if (fees.every((fee): fee is bigint => fee !== undefined)) {
    return fees.reduce((sum, fee) => sum + fee, 0n);
  }
  return undefined;
};

// ETH has 18 decimals
const ETH_DECIMALS = 18;
/**
 * Converts a wei amount to USD using the ETH price.
 * Only supports ETH (18 decimals).
 */
export const weiToUsd = ({
  ethPrice,
  wei,
}: {
  ethPrice: number;
  wei: bigint | undefined;
}) => parseFloat(formatUnits(wei ?? 0n, ETH_DECIMALS)) * ethPrice;
