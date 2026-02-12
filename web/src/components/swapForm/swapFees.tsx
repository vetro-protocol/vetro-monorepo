import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { useSwapFeesDisplay } from "hooks/useSwapFeesDisplay";
import { useTranslation } from "react-i18next";
import type { Token } from "types";

import { OutputLabel } from "./outputLabel";

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

  const { networkFeeDisplay, protocolFeeDisplay, totalFeesDisplay } =
    useSwapFeesDisplay({
      amountBigInt,
      approveAmount,
      fromInputValue,
      fromToken,
      operationGasEstimation,
      protocolFee,
    });

  return (
    <div className="w-full max-w-md border-t border-gray-200">
      <FeesContainer
        label={
          <OutputLabel
            fromInputValue={fromInputValue}
            fromToken={fromToken}
            outputValue={outputValue}
            toToken={toToken}
          />
        }
        totalFees={totalFeesDisplay}
      >
        <FeeDetails
          label={t("pages.swap.fees.network-fee")}
          value={networkFeeDisplay}
        />
        <FeeDetails
          label={t("pages.swap.fees.fixed-protocol-fee")}
          value={protocolFeeDisplay}
        />
      </FeesContainer>
    </div>
  );
};
