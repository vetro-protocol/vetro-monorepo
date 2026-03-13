import { useNetworkFee } from "hooks/useNetworkFee";
import type { Hash } from "viem";
import { useAccount } from "wagmi";

import { useEstimateBorrowFees } from "./useEstimateBorrowFees";

type Params = {
  borrowAmount: bigint;
  marketId: Hash;
  maxBorrowable: bigint | undefined;
};

export function useBorrowMoreFees({
  borrowAmount,
  marketId,
  maxBorrowable,
}: Params) {
  const { address } = useAccount();

  const withinBorrowLimit =
    maxBorrowable === undefined || borrowAmount <= maxBorrowable;

  const canEstimate = borrowAmount > 0n && !!address && withinBorrowLimit;

  const { fees, isError } = useEstimateBorrowFees({
    borrowAmount,
    canEstimate,
    marketId,
  });

  return useNetworkFee({
    fees,
    isEnabled: borrowAmount > 0n && withinBorrowLimit,
    isError,
  });
}
