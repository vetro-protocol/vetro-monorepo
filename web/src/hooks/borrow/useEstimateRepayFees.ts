import { useEstimateApproveErc20Fees } from "@hemilabs/react-hooks/useEstimateApproveErc20Fees";
import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { getChainAddresses } from "@morpho-org/blue-sdk";
import { encodeRepayAssets } from "@vetro/morpho-blue-market/actions";
import { useMainnet } from "hooks/useMainnet";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import { sumFees } from "utils/fees";
import type { Hash } from "viem";
import { useAccount, useEstimateGas } from "wagmi";

import { useMorphoMarket } from "./useMorphoMarket";

type Params = {
  canEstimate: boolean;
  loanToken: Token;
  marketId: Hash;
  repayAmount: bigint;
};

export function useEstimateRepayFees({
  canEstimate,
  loanToken,
  marketId,
  repayAmount,
}: Params) {
  const ethereumChain = useMainnet();
  const { address } = useAccount();
  const morphoAddress = getChainAddresses(ethereumChain.id).morpho;

  const { data: morphoMarket } = useMorphoMarket(marketId);

  const canEstimateRepay = canEstimate && morphoMarket !== undefined;

  const { data: needsApproval } = useNeedsApproval({
    amount: repayAmount,
    spender: morphoAddress,
    token: loanToken,
  });

  const { fees: approvalFees, isError: isApprovalError } =
    useEstimateApproveErc20Fees({
      amount: repayAmount,
      enabled: canEstimateRepay && !!needsApproval,
      spender: morphoAddress,
      token: {
        address: loanToken.address,
        chainId: loanToken.chainId,
      },
    });

  const allowanceStateOverride = createErc20AllowanceStateOverride({
    owner: address,
    spender: morphoAddress,
    token: loanToken,
  });

  const { data: repayGasUnits, isError: isRepayGasUnitsError } = useEstimateGas(
    {
      chainId: ethereumChain.id,
      data: canEstimateRepay
        ? encodeRepayAssets({
            amount: repayAmount,
            marketParams: morphoMarket!.params,
            onBehalf: address!,
          })
        : undefined,
      query: { enabled: canEstimateRepay },
      stateOverride: allowanceStateOverride,
      to: morphoAddress,
    },
  );

  const { fees: repayFees, isError: isRepayFeeError } = useEstimateFees({
    chainId: ethereumChain.id,
    gasUnits: repayGasUnits,
    isGasUnitsError: isRepayGasUnitsError,
  });

  const fees = needsApproval ? sumFees([approvalFees, repayFees]) : repayFees;

  const isError = isApprovalError || isRepayFeeError;

  return { fees, isError, needsApproval };
}
