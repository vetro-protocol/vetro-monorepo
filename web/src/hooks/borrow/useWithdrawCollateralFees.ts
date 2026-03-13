import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { getChainAddresses } from "@morpho-org/blue-sdk";
import { encodeWithdrawCollateral } from "@vetro/morpho-blue-market/actions";
import { useMainnet } from "hooks/useMainnet";
import { useNetworkFee } from "hooks/useNetworkFee";
import type { Hash } from "viem";
import { useAccount, useEstimateGas } from "wagmi";

import { useMorphoMarket } from "./useMorphoMarket";

type Params = {
  collateralAmount: bigint;
  marketId: Hash;
  maxWithdrawable: bigint | undefined;
};

export function useWithdrawCollateralFees({
  collateralAmount,
  marketId,
  maxWithdrawable,
}: Params) {
  const ethereumChain = useMainnet();
  const { address } = useAccount();
  const morphoAddress = getChainAddresses(ethereumChain.id).morpho;

  const { data: morphoMarket } = useMorphoMarket(marketId);

  const withinWithdrawLimit =
    maxWithdrawable === undefined || collateralAmount <= maxWithdrawable;

  const canEstimate =
    collateralAmount > 0n &&
    !!address &&
    withinWithdrawLimit &&
    morphoMarket !== undefined;

  const { data: withdrawGasUnits, isError: isWithdrawGasUnitsError } =
    useEstimateGas({
      chainId: ethereumChain.id,
      data: canEstimate
        ? encodeWithdrawCollateral({
            amount: collateralAmount,
            marketParams: morphoMarket!.params,
            onBehalf: address!,
            receiver: address!,
          })
        : undefined,
      query: {
        enabled: canEstimate,
        retry: false,
      },
      to: morphoAddress,
    });

  const { fees, isError } = useEstimateFees({
    chainId: ethereumChain.id,
    gasUnits: withdrawGasUnits,
    isGasUnitsError: isWithdrawGasUnitsError,
  });

  return useNetworkFee({
    fees,
    isEnabled: collateralAmount > 0n && withinWithdrawLimit,
    isError,
  });
}
