import { useEstimateApproveErc20Fees } from "@hemilabs/react-hooks/useEstimateApproveErc20Fees";
import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getChainAddresses } from "@morpho-org/blue-sdk";
import {
  encodeBorrowAssets,
  encodeSupplyCollateral,
} from "@vetro/morpho-blue-market/actions";
import { useMainnet } from "hooks/useMainnet";
import { useNetworkFee } from "hooks/useNetworkFee";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import { sumFees } from "utils/fees";
import { createMorphoCollateralStateOverride } from "utils/morphoStateOverride";
import { type Hash } from "viem";
import { useAccount, useEstimateGas } from "wagmi";

import { useMorphoMarket } from "./useMorphoMarket";

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

  const { data: morphoMarket } = useMorphoMarket(marketId);

  const hasEnoughBalance =
    collateralBalance !== undefined && collateralBalance >= collateralAmount;

  const withinBorrowLimit =
    maxBorrowable === undefined || borrowAmount <= maxBorrowable;

  const canEstimate = [
    borrowAmount > 0n,
    collateralAmount > 0n,
    !!address,
    hasEnoughBalance,
    morphoMarket !== undefined,
    withinBorrowLimit,
  ].every(Boolean);

  const { data: needsApproval } = useNeedsApproval({
    amount: collateralAmount,
    spender: morphoAddress,
    token: collateralToken,
  });

  const { fees: approvalFees, isError: isApprovalError } =
    useEstimateApproveErc20Fees({
      amount: collateralAmount,
      enabled: canEstimate && !!needsApproval,
      spender: morphoAddress,
      token: {
        address: collateralToken.address,
        chainId: collateralToken.chainId,
      },
    });

  const allowanceStateOverride = createErc20AllowanceStateOverride({
    owner: address,
    spender: morphoAddress,
    token: collateralToken,
  });

  const { data: supplyGasUnits, isError: isSupplyGasUnitsError } =
    useEstimateGas({
      chainId: ethereumChain.id,
      data: canEstimate
        ? encodeSupplyCollateral({
            amount: collateralAmount,
            marketParams: morphoMarket!.params,
            onBehalf: address!,
          })
        : undefined,
      query: { enabled: canEstimate },
      stateOverride: allowanceStateOverride,
      to: morphoAddress,
    });

  const { fees: supplyFees, isError: isSupplyFeeError } = useEstimateFees({
    chainId: ethereumChain.id,
    gasUnits: supplyGasUnits,
    isGasUnitsError: isSupplyGasUnitsError,
  });

  const borrowStateOverride = createMorphoCollateralStateOverride({
    collateralAmount,
    marketId,
    morphoAddress,
    user: address,
  });

  const { data: borrowGasUnits, isError: isBorrowGasUnitsError } =
    useEstimateGas({
      chainId: ethereumChain.id,
      data: canEstimate
        ? encodeBorrowAssets({
            amount: borrowAmount,
            marketParams: morphoMarket!.params,
            onBehalf: address!,
            receiver: address!,
          })
        : undefined,
      query: { enabled: canEstimate, retry: false },
      stateOverride: borrowStateOverride,
      to: morphoAddress,
    });

  const { fees: borrowFees, isError: isBorrowFeeError } = useEstimateFees({
    chainId: ethereumChain.id,
    gasUnits: borrowGasUnits,
    isGasUnitsError: isBorrowGasUnitsError,
  });

  const totalFees = needsApproval
    ? sumFees([approvalFees, supplyFees, borrowFees])
    : sumFees([supplyFees, borrowFees]);

  const hasUserInput =
    borrowAmount > 0n &&
    collateralAmount > 0n &&
    hasEnoughBalance &&
    withinBorrowLimit;

  const isError = [isApprovalError, isSupplyFeeError, isBorrowFeeError].some(
    Boolean,
  );
  return useNetworkFee({
    fees: totalFees,
    isEnabled: hasUserInput,
    isError,
  });
}
