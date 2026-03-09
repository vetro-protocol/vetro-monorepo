import { useEstimateApproveErc20Fees } from "@hemilabs/react-hooks/useEstimateApproveErc20Fees";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { getGatewayAddress } from "@vetro/gateway";
import type { Token } from "types";
import { formatAmount } from "utils/token";

import { useMainnet } from "./useMainnet";

// only add up fees when all are available
const sumFees = function (fees: (bigint | undefined)[]) {
  if (fees.every((fee): fee is bigint => fee !== undefined)) {
    return fees.reduce((sum, fee) => sum + fee, 0n);
  }
  return undefined;
};

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

  const { data: protocolFeeData, isError: isProtocolFeeError } = protocolFee;

  const networkFeeWei = needsApproval
    ? sumFees([approvalFee, operationFee])
    : operationFee;

  const hasNetworkFeeError = needsApproval
    ? isApprovalFeeError || isOperationFeeError
    : isOperationFeeError;

  const totalFeesWei = sumFees([networkFeeWei, protocolFeeData]);

  const networkFeeDisplay = formatAmount({
    amount: networkFeeWei,
    decimals: ethereumChain.nativeCurrency.decimals,
    isError: hasNetworkFeeError,
    symbol: ethereumChain.nativeCurrency.symbol,
  });

  const protocolFeeDisplay = formatAmount({
    amount: protocolFeeData,
    decimals: ethereumChain.nativeCurrency.decimals,
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
