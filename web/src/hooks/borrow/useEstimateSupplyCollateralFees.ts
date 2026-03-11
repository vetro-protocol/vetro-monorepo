import { useEstimateApproveErc20Fees } from "@hemilabs/react-hooks/useEstimateApproveErc20Fees";
import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { getChainAddresses } from "@morpho-org/blue-sdk";
import { encodeSupplyCollateral } from "@vetro/morpho-blue-market/actions";
import { useMainnet } from "hooks/useMainnet";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import { sumFees } from "utils/fees";
import type { Hash } from "viem";
import { useAccount, useEstimateGas } from "wagmi";

import { useMorphoMarket } from "./useMorphoMarket";

type Params = {
  canEstimate: boolean;
  collateralAmount: bigint;
  collateralToken: Token;
  marketId: Hash;
};

export function useEstimateSupplyCollateralFees({
  canEstimate,
  collateralAmount,
  collateralToken,
  marketId,
}: Params) {
  const ethereumChain = useMainnet();
  const { address } = useAccount();
  const morphoAddress = getChainAddresses(ethereumChain.id).morpho;

  const { data: morphoMarket } = useMorphoMarket(marketId);

  const canEstimateSupply = canEstimate && morphoMarket !== undefined;

  const { data: needsApproval } = useNeedsApproval({
    amount: collateralAmount,
    spender: morphoAddress,
    token: collateralToken,
  });

  const { fees: approvalFees, isError: isApprovalError } =
    useEstimateApproveErc20Fees({
      amount: collateralAmount,
      enabled: canEstimateSupply && !!needsApproval,
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
      data: canEstimateSupply
        ? encodeSupplyCollateral({
            amount: collateralAmount,
            marketParams: morphoMarket!.params,
            onBehalf: address!,
          })
        : undefined,
      query: { enabled: canEstimateSupply },
      stateOverride: allowanceStateOverride,
      to: morphoAddress,
    });

  const { fees: supplyFees, isError: isSupplyFeeError } = useEstimateFees({
    chainId: ethereumChain.id,
    gasUnits: supplyGasUnits,
    isGasUnitsError: isSupplyGasUnitsError,
  });

  const fees = needsApproval ? sumFees([approvalFees, supplyFees]) : supplyFees;

  const isError = isApprovalError || isSupplyFeeError;

  return { fees, isError, needsApproval };
}
