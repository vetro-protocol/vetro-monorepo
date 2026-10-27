import { Button } from "components/base/button";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { TokenInteractionList } from "components/base/tokenInteraction";
import {
  type Step,
  stepStatus,
  VerticalStepper,
} from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { NetworkFees } from "components/networkFees";
import { useAnimatedVisibility } from "hooks/useAnimatedVisibility";
import type { ComponentProps, ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type TransactionStep = "completed" | "failed" | "idle" | "progress";

const stepStatuses: Record<TransactionStep, Step["status"]> = {
  completed: stepStatus.completed,
  failed: stepStatus.failed,
  idle: stepStatus.ready,
  progress: stepStatus.progress,
};

type Props = {
  children: ReactNode;
  networkFee: ComponentProps<typeof NetworkFees>["networkFee"];
  onRetry?: VoidFunction;
  progressLabel: string;
  stepDescription: string;
  stepTitle: string;
  title: string;
  transactionStep: TransactionStep;
};

export function TransactionProgressDrawer({
  children,
  networkFee,
  onRetry,
  progressLabel,
  stepDescription,
  stepTitle,
  title,
  transactionStep,
}: Props) {
  const { t } = useTranslation();
  const { render: renderRetry, show: showRetry } =
    useAnimatedVisibility(!!onRetry);

  return (
    <div className="flex h-full flex-col">
      <DrawerTitle>{title}</DrawerTitle>

      <TokenInteractionList>{children}</TokenInteractionList>

      <DrawerFeesContainer>
        <NetworkFees networkFee={networkFee} />
      </DrawerFeesContainer>

      <div className="flex-1" />

      <div className="flex flex-col gap-2 px-6 pb-6">
        <p className="text-caption text-gray-500">{progressLabel}</p>
        <div className="border-t border-gray-200">
          <VerticalStepper
            steps={[
              {
                description: stepDescription,
                status: stepStatuses[transactionStep],
                title: stepTitle,
              },
            ]}
          />
        </div>
      </div>

      {renderRetry && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            showRetry ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 *:w-full">
              <Button onClick={onRetry} size="small" variant="primary">
                {t("pages.earn.stake.retry")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
