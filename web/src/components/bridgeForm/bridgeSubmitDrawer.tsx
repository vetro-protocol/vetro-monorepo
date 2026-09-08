import { Button } from "components/base/button";
import { Drawer } from "components/base/drawer";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import {
  TokenInteraction,
  TokenInteractionList,
} from "components/base/tokenInteraction";
import {
  type Step,
  VerticalStepper,
  stepStatus,
} from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { getChainById } from "networks";
import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { BridgeableToken } from "types";
import { getNativeToken } from "utils/nativeToken";

import { BridgeFees } from "./bridgeFees";
import { TokenChainLogo } from "./tokenChainLogo";

export type BridgeFlowStatus =
  | "approve-error"
  | "approved"
  | "approving"
  | "idle"
  | "send-error"
  | "send-ready"
  | "sending"
  | "sent";

type ActiveStatus = Exclude<BridgeFlowStatus, "idle">;

const approveStepStatuses: Record<ActiveStatus, Step["status"]> = {
  "approve-error": stepStatus.failed,
  approved: stepStatus.completed,
  approving: stepStatus.progress,
  "send-error": stepStatus.completed,
  "send-ready": stepStatus.completed,
  sending: stepStatus.completed,
  sent: stepStatus.completed,
};

const sendStepStatuses: Record<ActiveStatus, Step["status"]> = {
  "approve-error": stepStatus.notReady,
  approved: stepStatus.ready,
  approving: stepStatus.notReady,
  "send-error": stepStatus.failed,
  "send-ready": stepStatus.ready,
  sending: stepStatus.progress,
  sent: stepStatus.completed,
};

const waitingStepStatuses: Record<ActiveStatus, Step["status"]> = {
  "approve-error": stepStatus.notReady,
  approved: stepStatus.notReady,
  approving: stepStatus.notReady,
  "send-error": stepStatus.notReady,
  "send-ready": stepStatus.notReady,
  sending: stepStatus.notReady,
  sent: stepStatus.ready,
};

type Props = {
  flowStatus: ActiveStatus;
  fromAmount: string;
  fromToken: BridgeableToken;
  onClose: VoidFunction;
  onRetry: VoidFunction;
  showApproveStep: boolean;
  toAmount: string;
  toToken: BridgeableToken;
} & Pick<
  ComponentProps<typeof BridgeFees>,
  "layerZeroFee" | "networkFee" | "total"
>;

export function BridgeSubmitDrawer({
  flowStatus,
  fromAmount,
  fromToken,
  layerZeroFee,
  networkFee,
  onClose,
  onRetry,
  showApproveStep,
  toAmount,
  total,
  toToken,
}: Props) {
  const { t } = useTranslation();

  const fromChain = getChainById(fromToken.chainId);
  const toChain = getChainById(toToken.chainId);

  const isError = flowStatus === "approve-error" || flowStatus === "send-error";

  const steps: Step[] = [
    {
      description: t("pages.bridge.progress.send-description"),
      status: sendStepStatuses[flowStatus],
      title: t("pages.bridge.progress.send-title"),
    },
    {
      description: t("pages.bridge.progress.waiting-description"),
      status: waitingStepStatuses[flowStatus],
      title: t("pages.bridge.progress.waiting-title"),
    },
  ];

  if (showApproveStep) {
    steps.unshift({
      description: t("pages.bridge.progress.approve-description"),
      status: approveStepStatuses[flowStatus],
      title: t("pages.bridge.progress.approve-title"),
    });
  }

  return (
    <Drawer onClose={onClose}>
      <div className="flex h-full flex-col">
        <DrawerTitle>{t("pages.bridge.progress.title")}</DrawerTitle>

        <TokenInteractionList>
          <TokenInteraction
            amount={fromAmount}
            detail={t("pages.bridge.form.from-chain", {
              chain: fromChain.name,
            })}
            label={t("pages.bridge.form.you-are-sending")}
            logo={<TokenChainLogo size="large" token={fromToken} />}
            token={fromToken}
          />

          <TokenInteraction
            amount={toAmount}
            detail={t("pages.bridge.form.on-chain", { chain: toChain.name })}
            label={t("pages.bridge.form.you-will-receive")}
            logo={<TokenChainLogo size="large" token={toToken} />}
            token={toToken}
          />
        </TokenInteractionList>

        <DrawerFeesContainer>
          <BridgeFees
            layerZeroFee={layerZeroFee}
            nativeToken={getNativeToken(fromChain)}
            networkFee={networkFee}
            total={total}
          />
        </DrawerFeesContainer>

        <div className="flex-1" />

        <div className="flex flex-col gap-2 px-6 pb-6">
          <p className="text-caption text-gray-500">
            {t("pages.bridge.progress.bridge-progress")}
          </p>
          <div className="border-t border-gray-200">
            <VerticalStepper steps={steps} />
          </div>
        </div>

        {isError && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 *:w-full">
            <Button onClick={onRetry} size="small" variant="primary">
              {t("pages.bridge.progress.retry")}
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
