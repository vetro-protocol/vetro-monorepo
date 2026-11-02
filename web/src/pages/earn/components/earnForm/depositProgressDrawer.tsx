import type { Token } from "@vetro-protocol/core";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { DollarSign } from "components/base/dollarSign";
import { DrawerRetryFooter } from "components/base/drawer/drawerRetryFooter";
import { RenderFiatValue } from "components/base/fiatValue";
import {
  TokenInteraction,
  TokenInteractionList,
} from "components/base/tokenInteraction";
import { type Step, VerticalStepper } from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { NetworkFees } from "components/networkFees";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";

import { getDepositSteps } from "./getDepositSteps";
import type { DepositStep } from "./stakeFormReducer";

type Props = {
  amount: string;
  approvalCompleted: boolean;
  assets: bigint;
  confirmText: Pick<Step, "description" | "title">;
  depositStep: DepositStep;
  needsApproval: boolean | undefined;
  networkFee: ComponentProps<typeof NetworkFees>["networkFee"];
  onRetry?: VoidFunction;
  peggedToken: TokenWithGateway;
  progressLabel: string;
  shares: bigint | undefined;
  sharesStatus: ComponentProps<typeof RenderCryptoValue>["status"];
  shareToken: Token;
};

export function DepositProgressDrawer({
  amount,
  approvalCompleted,
  assets,
  confirmText,
  depositStep,
  needsApproval,
  networkFee,
  onRetry,
  peggedToken,
  progressLabel,
  shares,
  sharesStatus,
  shareToken,
}: Props) {
  const { t } = useTranslation();

  const steps = getDepositSteps({
    approvalCompleted,
    approveText: {
      description: t("pages.earn.stake.deposit-step-approve-description"),
      title: t("pages.earn.stake.deposit-step-approve-title"),
    },
    confirmText,
    depositStep,
    needsApproval,
  });

  const fiatDetail = (
    <>
      <DollarSign />
      <RenderFiatValue token={peggedToken} value={assets} />
    </>
  );

  return (
    <div className="flex h-full flex-col">
      <TokenInteractionList>
        <TokenInteraction
          amount={amount}
          detail={fiatDetail}
          label={t("pages.earn.stake.you-will-stake")}
          token={peggedToken}
        />
        <TokenInteraction
          amount={
            <RenderCryptoValue
              status={sharesStatus}
              token={shareToken}
              value={shares}
            />
          }
          detail={fiatDetail}
          label={t("pages.earn.stake.you-will-receive-estimated")}
          token={shareToken}
        />
      </TokenInteractionList>

      <DrawerFeesContainer>
        <NetworkFees networkFee={networkFee} />
      </DrawerFeesContainer>

      <div className="flex-1" />

      <div className="flex flex-col gap-2 px-6 pb-6">
        <p className="text-caption text-gray-500">{progressLabel}</p>
        <div className="border-t border-gray-200">
          <VerticalStepper steps={steps} />
        </div>
      </div>

      <DrawerRetryFooter onRetry={onRetry} />
    </div>
  );
}
