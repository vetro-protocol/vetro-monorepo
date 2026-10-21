import type { Token } from "@vetro-protocol/core";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { DollarSign } from "components/base/dollarSign";
import { RenderFiatValue } from "components/base/fiatValue";
import { TokenInteraction } from "components/base/tokenInteraction";
import {
  TransactionProgressDrawer,
  type TransactionStep,
} from "components/earn/transactionProgressDrawer";
import type { NetworkFees } from "components/networkFees";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  assets: bigint;
  networkFee: ComponentProps<typeof NetworkFees>["networkFee"];
  onRetry?: VoidFunction;
  peggedToken: Token;
  transactionStep: TransactionStep;
};

export function CancelDepositProgressDrawer({
  assets,
  networkFee,
  onRetry,
  peggedToken,
  transactionStep,
}: Props) {
  const { t } = useTranslation();

  return (
    <TransactionProgressDrawer
      networkFee={networkFee}
      onRetry={onRetry}
      progressLabel={t("pages.earn.fixed-term.cancel-deposit-progress")}
      stepDescription={t(
        "pages.earn.fixed-term.cancel-deposit-step-confirm-description",
      )}
      stepTitle={t("pages.earn.fixed-term.cancel-deposit-step-confirm-title")}
      title={t("pages.earn.fixed-term.cancel-deposit-in-progress")}
      transactionStep={transactionStep}
    >
      <TokenInteraction
        amount={<RenderCryptoValue token={peggedToken} value={assets} />}
        detail={
          <>
            <DollarSign />
            <RenderFiatValue token={peggedToken} value={assets} />
          </>
        }
        label={t("pages.earn.stake.you-will-receive")}
        token={peggedToken}
      />
    </TransactionProgressDrawer>
  );
}
