import { Button } from "components/base/button";
import { Drawer } from "components/base/drawer";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import {
  type Step,
  VerticalStepper,
  stepStatus,
} from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { allChains } from "networks";
import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { BridgeableToken } from "types";

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
  total,
  toToken,
}: Props) {
  const { t } = useTranslation();

  const fromChain = allChains.find((c) => c.id === fromToken.chainId);
  const toChain = allChains.find((c) => c.id === toToken.chainId);

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

        <div className="flex flex-col gap-10 border-y border-gray-200 bg-gray-50 p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xsm text-gray-500">
              {t("pages.bridge.form.you-are-sending")}
            </p>
            <div className="flex items-center gap-3">
              <p className="flex items-center gap-x-2 text-4xl leading-10 font-semibold tracking-tight text-gray-900">
                <span>{fromAmount}</span>
                <span className="text-gray-500">{fromToken.symbol}</span>
              </p>
              <TokenChainLogo size="large" token={fromToken} />
            </div>
            {fromChain && (
              <p className="text-xsm text-gray-500">
                {t("pages.bridge.form.from-chain", { chain: fromChain.name })}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xsm text-gray-500">
              {t("pages.bridge.form.you-will-receive")}
            </p>
            <div className="flex items-center gap-3">
              <p className="flex items-center gap-x-2 text-4xl leading-10 font-semibold tracking-tight text-gray-900">
                <span>{fromAmount}</span>
                <span className="text-gray-500">{toToken.symbol}</span>
              </p>
              <TokenChainLogo size="large" token={toToken} />
            </div>
            {toChain && (
              <p className="text-xsm text-gray-500">
                {t("pages.bridge.form.on-chain", { chain: toChain.name })}
              </p>
            )}
          </div>
        </div>

        <DrawerFeesContainer>
          <BridgeFees
            layerZeroFee={layerZeroFee}
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
