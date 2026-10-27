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
  shares: bigint;
  shareToken: Token;
  transactionStep: TransactionStep;
};

export function CancelExitProgressDrawer({
  assets,
  networkFee,
  onRetry,
  peggedToken,
  shares,
  shareToken,
  transactionStep,
}: Props) {
  const { t } = useTranslation();

  return (
    <TransactionProgressDrawer
      networkFee={networkFee}
      onRetry={onRetry}
      progressLabel={t("pages.earn.fixed-term.cancel-exit-progress")}
      stepDescription={t(
        "pages.earn.fixed-term.cancel-exit-step-confirm-description",
      )}
      stepTitle={t("pages.earn.fixed-term.cancel-exit-step-confirm-title")}
      title={t("pages.earn.fixed-term.cancel-exit-in-progress")}
      transactionStep={transactionStep}
    >
      <TokenInteraction
        amount={<RenderCryptoValue token={shareToken} value={shares} />}
        detail={
          <>
            <DollarSign />
            <RenderFiatValue token={peggedToken} value={assets} />
          </>
        }
        label={t("pages.earn.stake.you-will-receive")}
        token={shareToken}
      />
    </TransactionProgressDrawer>
  );
}
