import { DrawerRetryFooter } from "components/base/drawer/drawerRetryFooter";
import { TokenInteractionList } from "components/base/tokenInteraction";
import {
  type Step,
  stepStatus,
  VerticalStepper,
} from "components/base/verticalStepper";
import { DrawerFeesContainer } from "components/feesContainer";
import { NetworkFees } from "components/networkFees";
import type { ComponentProps, ReactNode } from "react";

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
  transactionStep: TransactionStep;
};

export const TransactionProgressDrawer = ({
  children,
  networkFee,
  onRetry,
  progressLabel,
  stepDescription,
  stepTitle,
  transactionStep,
}: Props) => (
  <div className="flex h-full flex-col">
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

    <DrawerRetryFooter onRetry={onRetry} />
  </div>
);
