import { useEstimateApproveErc20Fees } from "@hemilabs/react-hooks/useEstimateApproveErc20Fees";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { getGatewayAddress } from "@vetro/gateway";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { useMainnet } from "hooks/useMainnet";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";

type Props = {
  amountBigInt: bigint;
  approveAmount: bigint | undefined;
  fromInputValue: string;
  fromToken: Token;
  operationGasEstimation: {
    fees: bigint | undefined;
    isEnabled: boolean;
    isError: boolean;
  };
  outputValue: string;
  protocolFee: { data: bigint | undefined; isError: boolean };
  toToken: Token;
};

// only add up fees when all are available
const sumFees = function (fees: (bigint | undefined)[]) {
  if (fees.every((fee): fee is bigint => fee !== undefined)) {
    return fees.reduce((sum, fee) => sum + fee, 0n);
  }
  return undefined;
};

export const SwapFees = function ({
  amountBigInt,
  approveAmount,
  fromInputValue,
  fromToken,
  operationGasEstimation,
  outputValue,
  protocolFee,
  toToken,
}: Props) {
  const { t } = useTranslation();
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
    symbol: ethereumChain.nativeCurrency.symbol,
  });

  const totalFeesDisplay = formatAmount({
    amount: totalFeesWei,
    decimals: ethereumChain.nativeCurrency.decimals,
    isError: hasNetworkFeeError || isProtocolFeeError,
    symbol: ethereumChain.nativeCurrency.symbol,
  });

  const label = `${fromInputValue} ${fromToken.symbol} = ${outputValue} ${toToken.symbol}`;

  return (
    <div className="w-full max-w-md border-t border-gray-200">
      <FeesContainer
        label={label}
        totalFees={isOperationGasEstimationEnabled ? totalFeesDisplay : "-"}
      >
        <FeeDetails
          label={t("pages.swap.fees.network-fee")}
          value={isOperationGasEstimationEnabled ? networkFeeDisplay : "-"}
        />
        <FeeDetails
          label={t("pages.swap.fees.fixed-protocol-fee")}
          value={protocolFeeDisplay}
        />
      </FeesContainer>
    </div>
  );
};
