import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getChainAddresses } from "@morpho-org/blue-sdk";
import { useMainnet } from "hooks/useMainnet";
import { useNetworkFee } from "hooks/useNetworkFee";
import type { Token } from "types";
import { sumFees } from "utils/fees";
import { createMorphoCollateralStateOverride } from "utils/morphoStateOverride";
import { type Hash } from "viem";
import { useAccount } from "wagmi";

import { useEstimateBorrowFees } from "./useEstimateBorrowFees";
import { useEstimateSupplyCollateralFees } from "./useEstimateSupplyCollateralFees";

type Params = {
  borrowAmount: bigint;
  collateralAmount: bigint;
  collateralToken: Token;
  marketId: Hash;
  maxBorrowable: bigint | undefined;
};

export function useSupplyAndBorrowFees({
  borrowAmount,
  collateralAmount,
  collateralToken,
  marketId,
  maxBorrowable,
}: Params) {
  const ethereumChain = useMainnet();
  const { address } = useAccount();
  const morphoAddress = getChainAddresses(ethereumChain.id).morpho;

  const { data: collateralBalance } = useTokenBalance({
    address: collateralToken.address,
    chainId: collateralToken.chainId,
  });

  const hasEnoughBalance =
    collateralBalance !== undefined && collateralBalance >= collateralAmount;

  const withinBorrowLimit =
    maxBorrowable === undefined || borrowAmount <= maxBorrowable;

  const canEstimate = [
    borrowAmount > 0n,
    collateralAmount > 0n,
    !!address,
    hasEnoughBalance,
    withinBorrowLimit,
  ].every(Boolean);

  const { fees: supplyCollateralFees, isError: isSupplyCollateralError } =
    useEstimateSupplyCollateralFees({
      canEstimate,
      collateralAmount,
      collateralToken,
      marketId,
    });

  const borrowStateOverride = createMorphoCollateralStateOverride({
    collateralAmount,
    marketId,
    morphoAddress,
    user: address,
  });

  const { fees: borrowFees, isError: isBorrowFeeError } = useEstimateBorrowFees(
    {
      borrowAmount,
      canEstimate,
      marketId,
      stateOverride: borrowStateOverride,
    },
  );

  const totalFees = sumFees([supplyCollateralFees, borrowFees]);

  const hasUserInput =
    borrowAmount > 0n &&
    collateralAmount > 0n &&
    hasEnoughBalance &&
    withinBorrowLimit;

  const isError = isSupplyCollateralError || isBorrowFeeError;

  return useNetworkFee({
    fees: totalFees,
    isEnabled: hasUserInput,
    isError,
  });
}
