import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { getChainAddresses } from "@morpho-org/blue-sdk";
import { encodeBorrowAssets } from "@vetro/morpho-blue-market/actions";
import { useMainnet } from "hooks/useMainnet";
import { createMorphoCollateralStateOverride } from "utils/morphoStateOverride";
import type { Hash } from "viem";
import { useAccount, useEstimateGas } from "wagmi";

import { useMorphoMarket } from "./useMorphoMarket";

type Params = {
  borrowAmount: bigint;
  canEstimate: boolean;
  marketId: Hash;
  stateOverride?: ReturnType<typeof createMorphoCollateralStateOverride>;
};

export function useEstimateBorrowFees({
  borrowAmount,
  canEstimate,
  marketId,
  stateOverride,
}: Params) {
  const ethereumChain = useMainnet();
  const { address } = useAccount();
  const morphoAddress = getChainAddresses(ethereumChain.id).morpho;

  const { data: morphoMarket } = useMorphoMarket(marketId);

  const canEstimateBorrow = canEstimate && morphoMarket !== undefined;

  const { data: borrowGasUnits, isError: isBorrowGasUnitsError } =
    useEstimateGas({
      chainId: ethereumChain.id,
      data: canEstimateBorrow
        ? encodeBorrowAssets({
            amount: borrowAmount,
            marketParams: morphoMarket!.params,
            onBehalf: address!,
            receiver: address!,
          })
        : undefined,
      query: {
        enabled: canEstimateBorrow,
        retry: false,
      },
      stateOverride,
      to: morphoAddress,
    });

  const { fees, isError } = useEstimateFees({
    chainId: ethereumChain.id,
    gasUnits: borrowGasUnits,
    isGasUnitsError: isBorrowGasUnitsError,
  });

  return { fees, isError };
}
