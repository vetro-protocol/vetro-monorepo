import { useEstimateApproveErc20Fees } from "@hemilabs/react-hooks/useEstimateApproveErc20Fees";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { getGatewayAddress } from "@vetro/gateway";
import type { Token } from "types";
import { applyBps, sumFees } from "utils/fees";
import { formatAmount } from "utils/token";

import { useMainnet } from "./useMainnet";

export const useSwapFeesDisplay = function ({
  amountBigInt,
  approveAmount,
  fromToken,
  operationGasEstimation,
  protocolFee,
}: {
  amountBigInt: bigint;
  approveAmount: bigint | undefined;
  fromToken: Token;
  operationGasEstimation: {
    fees: bigint | undefined;
    isEnabled: boolean;
    isError: boolean;
  };
  protocolFee: { data: bigint | undefined; isError: boolean };
}) {
  const ethereumChain = useMainnet();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  const { data: needsApproval } = useNeedsApproval({
    amount: amountBigInt,
    spender: gatewayAddress,
    token: fromToken,
  });

  const { fees: approvalFee, isError: isApprovalFeeError } =
    useEstimateApproveErc20Fees({
      amount: approveAmount ?? amountBigInt,
      enabled: needsApproval,
      spender: gatewayAddress,
      token: fromToken,
    });

  const {
    fees: operationFee,
    isEnabled: isOperationGasEstimationEnabled,
    isError: isOperationFeeError,
  } = operationGasEstimation;

  const { data: protocolFeeBps, isError: isProtocolFeeError } = protocolFee;

  const protocolFeeAmount =
    protocolFeeBps !== undefined
      ? applyBps(amountBigInt, protocolFeeBps)
      : undefined;

  const networkFeeWei = needsApproval
    ? sumFees([approvalFee, operationFee])
    : operationFee;

  const hasNetworkFeeError = needsApproval
    ? isApprovalFeeError || isOperationFeeError
    : isOperationFeeError;

  const totalFeesWei = sumFees([networkFeeWei, protocolFeeAmount]);

  const networkFeeDisplay = formatAmount({
    amount: networkFeeWei,
    decimals: ethereumChain.nativeCurrency.decimals,
    isError: hasNetworkFeeError,
    symbol: ethereumChain.nativeCurrency.symbol,
  });

  const protocolFeeDisplay = formatAmount({
    amount: protocolFeeAmount,
    decimals: fromToken.decimals,
    isError: isProtocolFeeError,
    symbol: fromToken.symbol,
  });

  const totalFeesDisplay = formatAmount({
    amount: totalFeesWei,
    decimals: ethereumChain.nativeCurrency.decimals,
    isError: hasNetworkFeeError || isProtocolFeeError,
    symbol: ethereumChain.nativeCurrency.symbol,
  });

  return {
    isOperationGasEstimationEnabled,
    networkFeeDisplay: isOperationGasEstimationEnabled
      ? networkFeeDisplay
      : "-",
    protocolFeeDisplay,
    totalFeesDisplay: isOperationGasEstimationEnabled ? totalFeesDisplay : "-",
  };
};
