import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { useNetworkFee } from "hooks/useNetworkFee";
import type { Token } from "types";
import type { Hash } from "viem";
import { useAccount } from "wagmi";

import { useEstimateRepayFees } from "./useEstimateRepayFees";

type Params = {
  currentBorrowAssets: bigint | undefined;
  loanToken: Token;
  marketId: Hash;
  repayAmount: bigint;
};

export function useRepayFees({
  currentBorrowAssets,
  loanToken,
  marketId,
  repayAmount,
}: Params) {
  const { address } = useAccount();

  const { data: loanBalance } = useTokenBalance({
    address: loanToken.address,
    chainId: loanToken.chainId,
  });

  const withinRepayLimit =
    currentBorrowAssets === undefined || repayAmount <= currentBorrowAssets;

  const hasEnoughBalance =
    loanBalance !== undefined && loanBalance >= repayAmount;

  const canEstimate =
    repayAmount > 0n && !!address && withinRepayLimit && hasEnoughBalance;

  const { fees, isError } = useEstimateRepayFees({
    canEstimate,
    loanToken,
    marketId,
    repayAmount,
  });

  return useNetworkFee({
    fees,
    isEnabled: repayAmount > 0n && withinRepayLimit && hasEnoughBalance,
    isError,
  });
}
