import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { useNetworkFee } from "hooks/useNetworkFee";
import type { Token } from "types";
import type { Hash } from "viem";
import { useAccount } from "wagmi";

import { useEstimateSupplyCollateralFees } from "./useEstimateSupplyCollateralFees";

type Params = {
  collateralAmount: bigint;
  collateralToken: Token;
  marketId: Hash;
};

export function useSupplyCollateralFees({
  collateralAmount,
  collateralToken,
  marketId,
}: Params) {
  const { address } = useAccount();

  const { data: collateralBalance } = useTokenBalance({
    address: collateralToken.address,
    chainId: collateralToken.chainId,
  });

  const hasUserInput = collateralAmount > 0n;

  const hasEnoughBalance =
    collateralBalance !== undefined && collateralBalance >= collateralAmount;

  const canEstimate = hasUserInput && !!address && hasEnoughBalance;

  const { fees, isError } = useEstimateSupplyCollateralFees({
    canEstimate,
    collateralAmount,
    collateralToken,
    marketId,
  });

  return useNetworkFee({
    fees,
    isEnabled: hasUserInput && hasEnoughBalance,
    isError,
  });
}
