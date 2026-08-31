import type { Token } from "@vetro-protocol/core";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { DollarSign } from "components/base/dollarSign";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { RenderFiatValue } from "components/base/fiatValue";
import {
  TokenInteraction,
  TokenInteractionList,
} from "components/base/tokenInteraction";
import { VerticalStepper, stepStatus } from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { NetworkFees } from "components/networkFees";
import { useVaultPreviewWithdraw } from "hooks/useVaultPreviewWithdraw";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { TokenWithGateway } from "types";
import type { Address } from "viem";

import type { WithdrawStep } from "../stakeDrawer/stakeDrawerReducer";

type SummaryProps = {
  amount: string;
  assets: bigint;
  peggedToken: TokenWithGateway;
};

type Props = SummaryProps & {
  canInstantWithdraw: boolean;
  cooldownDays: number | undefined;
  networkFee: ComponentProps<typeof NetworkFees>["networkFee"];
  shareToken: Token;
  stakingVaultAddress: Address;
  withdrawStep: WithdrawStep;
};

function getRequestStepStatus(withdrawStep: WithdrawStep) {
  if (withdrawStep === "completed") {
    return stepStatus.completed;
  }
  if (withdrawStep === "requesting" || withdrawStep === "withdrawing") {
    return stepStatus.progress;
  }
  if (withdrawStep === "request-failed" || withdrawStep === "failed") {
    return stepStatus.failed;
  }
  return stepStatus.ready;
}

function useWithdrawSteps({
  canInstantWithdraw,
  cooldownDays,
  withdrawStep,
}: Pick<Props, "canInstantWithdraw" | "cooldownDays" | "withdrawStep">) {
  const { t } = useTranslation();
  const requestStatus = getRequestStepStatus(withdrawStep);

  if (canInstantWithdraw) {
    return [
      {
        description: t("pages.earn.stake.instant-withdraw-step-description"),
        status: requestStatus,
        title: t("pages.earn.stake.instant-withdraw-step-title"),
      },
    ];
  }

  return [
    {
      description: t("pages.earn.stake.withdraw-step-1-description"),
      status: requestStatus,
      title: t("pages.earn.stake.withdraw-step-1-title"),
    },
    {
      description:
        cooldownDays !== undefined ? (
          t("pages.earn.stake.withdraw-step-2-description", {
            count: cooldownDays,
          })
        ) : (
          <Skeleton width={200} />
        ),
      status:
        withdrawStep === "completed" ? stepStatus.ready : stepStatus.notReady,
      title:
        cooldownDays !== undefined ? (
          t("pages.earn.stake.withdraw-step-2-title", {
            count: cooldownDays,
          })
        ) : (
          <Skeleton width={140} />
        ),
    },
    {
      description: t("pages.earn.stake.withdraw-step-3-description"),
      status: stepStatus.notReady,
      title: t("pages.earn.stake.withdraw-step-3-title"),
    },
  ];
}

function InstantWithdrawSummary({
  amount,
  assets,
  peggedToken,
  shareToken,
  stakingVaultAddress,
}: SummaryProps & { shareToken: Token; stakingVaultAddress: Address }) {
  const { t } = useTranslation();
  const { data: sharesBurned, status: sharesBurnedStatus } =
    useVaultPreviewWithdraw({ assets, stakingVaultAddress });

  const fiatDetail = (
    <>
      <DollarSign />
      <RenderFiatValue token={peggedToken} value={assets} />
    </>
  );

  return (
    <>
      <TokenInteraction
        amount={
          <RenderCryptoValue
            status={sharesBurnedStatus}
            token={shareToken}
            value={sharesBurned}
          />
        }
        detail={fiatDetail}
        label={t("pages.earn.stake.you-will-unstake-estimated")}
        token={shareToken}
      />
      <TokenInteraction
        amount={amount}
        detail={fiatDetail}
        label={t("pages.earn.stake.you-will-receive")}
        token={peggedToken}
      />
    </>
  );
}

function QueuedWithdrawSummary({
  amount,
  assets,
  cooldownDays,
  peggedToken,
}: SummaryProps & { cooldownDays: number | undefined }) {
  const { t } = useTranslation();

  return (
    <TokenInteraction
      amount={amount}
      detail={
        <>
          <DollarSign />
          <RenderFiatValue token={peggedToken} value={assets} />
        </>
      }
      label={t("pages.earn.stake.you-are-requesting-to-withdraw")}
      subtitle={
        cooldownDays !== undefined ? (
          t("pages.earn.stake.ready-to-withdraw-in", { count: cooldownDays })
        ) : (
          <Skeleton width={160} />
        )
      }
      token={peggedToken}
    />
  );
}

export function StakeWithdrawProgressDrawer({
  amount,
  assets,
  canInstantWithdraw,
  cooldownDays,
  networkFee,
  peggedToken,
  shareToken,
  stakingVaultAddress,
  withdrawStep,
}: Props) {
  const { t } = useTranslation();

  const steps = useWithdrawSteps({
    canInstantWithdraw,
    cooldownDays,
    withdrawStep,
  });

  return (
    <div className="flex h-full flex-col">
      <DrawerTitle>{t("pages.earn.stake.withdraw-in-progress")}</DrawerTitle>

      <TokenInteractionList>
        {canInstantWithdraw ? (
          <InstantWithdrawSummary
            amount={amount}
            assets={assets}
            peggedToken={peggedToken}
            shareToken={shareToken}
            stakingVaultAddress={stakingVaultAddress}
          />
        ) : (
          <QueuedWithdrawSummary
            amount={amount}
            assets={assets}
            cooldownDays={cooldownDays}
            peggedToken={peggedToken}
          />
        )}
      </TokenInteractionList>

      <DrawerFeesContainer>
        <NetworkFees networkFee={networkFee} />
      </DrawerFeesContainer>

      <div className="flex-1" />

      <div className="flex flex-col gap-2 px-6 pb-6">
        <p className="text-caption text-gray-500">
          {t("pages.earn.stake.withdraw-progress")}
        </p>
        <div className="border-t border-gray-200">
          <VerticalStepper steps={steps} />
        </div>
      </div>
    </div>
  );
}
