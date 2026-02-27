import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { useSwapFeesDisplay } from "hooks/useSwapFeesDisplay";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";

type Props = {
  amountBigInt: bigint;
  approveAmount: bigint | undefined;
  fromToken: Token;
  operationGasEstimation: {
    fees: bigint | undefined;
    isEnabled: boolean;
    isError: boolean;
  };
  outputLabel?: ReactNode;
  protocolFee: { data: bigint | undefined; isError: boolean };
};

export const SwapFees = function ({
  amountBigInt,
  approveAmount,
  fromToken,
  operationGasEstimation,
  outputLabel,
  protocolFee,
}: Props) {
  const { t } = useTranslation();

  const { networkFeeDisplay, protocolFeeDisplay, totalFeesDisplay } =
    useSwapFeesDisplay({
      amountBigInt,
      approveAmount,
      fromToken,
      operationGasEstimation,
      protocolFee,
    });

  return (
    <div className="w-full border-b border-gray-200">
      <div className="mx-auto w-full max-w-md">
        <FeesContainer label={outputLabel} totalFees={totalFeesDisplay}>
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
    </div>
  );
};
