import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { RenderFiatValue } from "components/base/fiatValue";
import { VerticalStepper, stepStatus } from "components/base/verticalStepper";
import { CollapsibleSection } from "components/collapsibleSection";
import { NetworkFees } from "components/networkFees";
import { SetMaxStakedBalance } from "components/setMaxStakedBalance";
import { TokenInput } from "components/tokenInput";
import { Balance } from "components/tokenInput/balance";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useInstantWithdraw } from "hooks/useInstantWithdraw";
import { useMainnet } from "hooks/useMainnet";
import { useStakedBalance } from "hooks/useStakedBalance";
import { useStakeWithdraw } from "hooks/useStakeWithdraw";
import { useVusd } from "hooks/useVusd";
import { useCanInstantWithdraw } from "pages/earn/hooks/useCanInstantWithdraw";
import { useCooldownDuration } from "pages/earn/hooks/useCooldownDuration";
import { useTotalWithdrawFees } from "pages/earn/hooks/useTotalWithdrawFees";
import { type FormEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { formatAmount } from "utils/token";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";

import type { WithdrawStep } from "./stakeDrawerReducer";
import { StakeSubmitButton } from "./stakeSubmitButton";

type Props = {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSuccess: (toast: { description: string; title: string }) => void;
  onWithdrawStepChange: (step: WithdrawStep) => void;
  withdrawStep: WithdrawStep;
};

function getWithdrawErrors({
  amount,
  nativeBalance,
  stakedBalance,
}: {
  amount: bigint;
  nativeBalance: bigint | undefined;
  stakedBalance: bigint | undefined;
}) {
  if (amount === 0n) {
    return "enter-amount";
  }
  if (stakedBalance !== undefined && amount > stakedBalance) {
    return "insufficient-balance";
  }
  if (nativeBalance !== undefined && nativeBalance === 0n) {
    return "insufficient-gas";
  }
  return undefined;
}

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

function getWithdrawSteps({
  canInstantWithdraw,
  cooldownDays,
  t,
  withdrawStep,
}: {
  canInstantWithdraw: boolean | undefined;
  cooldownDays: number | undefined;
  t: ReturnType<typeof useTranslation>["t"];
  withdrawStep: WithdrawStep;
}) {
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

export function StakeWithdrawForm({
  inputValue,
  onInputChange,
  onSuccess,
  onWithdrawStepChange,
  withdrawStep,
}: Props) {
  const { isConnected } = useAccount();
  const { data: canInstantWithdraw } = useCanInstantWithdraw();
  const chain = useMainnet();
  const { data: cooldownDays } = useCooldownDuration();
  const { openConnectModal } = useConnectModal();
  const { t } = useTranslation();
  const { data: vusd } = useVusd();

  const instantTracking = useActivityTracking({
    page: "earn",
    text: t("pages.earn.activity.instant-withdraw-text", {
      amount: inputValue,
      symbol: vusd?.symbol,
    }),
    title: `${t("nav.earn")} · ${t("pages.earn.stake.instant-withdraw")}`,
  });

  const requestTracking = useActivityTracking({
    page: "earn",
    text: t("pages.earn.activity.request-withdraw-text", {
      amount: inputValue,
      symbol: vusd?.symbol,
    }),
    title: `${t("nav.earn")} · ${t("pages.earn.stake.withdraw")}`,
  });

  const tracking = canInstantWithdraw ? instantTracking : requestTracking;

  const { data: stakedBalance, isError: isStakedBalanceError } =
    useStakedBalance();

  const { data: nativeBalanceData } = useNativeBalance(chain.id);
  const nativeBalance = nativeBalanceData?.value;

  const amountBigInt = vusd ? parseUnits(inputValue, vusd.decimals) : 0n;

  const handleRequestWithdrawSuccess = function () {
    onSuccess({
      description: t("pages.earn.stake.withdraw-toast-description", {
        count: cooldownDays,
      }),
      title: t("pages.earn.stake.withdraw-toast-title"),
    });
  };

  const handleInstantWithdrawSuccess = function () {
    onSuccess({
      description: t("pages.earn.stake.instant-withdraw-toast-description"),
      title: t("pages.earn.stake.instant-withdraw-toast-title"),
    });
  };

  const handleWithdrawStepChange = useCallback(
    function handleWithdrawStepChange(step: WithdrawStep) {
      onWithdrawStepChange(step);
      const handlers: Partial<Record<WithdrawStep, () => void>> = {
        completed: tracking.onCompleted,
        failed: tracking.onFailed,
        "request-failed": tracking.onFailed,
        requesting: tracking.onPending,
        withdrawing: tracking.onPending,
      };
      handlers[step]?.();
    },
    [onWithdrawStepChange, tracking],
  );

  const requestWithdrawMutation = useStakeWithdraw({
    assets: amountBigInt,
    onStatusChange: handleWithdrawStepChange,
    onSuccess: handleRequestWithdrawSuccess,
    onTransactionHash: tracking.onTransactionHash,
  });

  const instantWithdrawMutation = useInstantWithdraw({
    assets: amountBigInt,
    onStatusChange: handleWithdrawStepChange,
    onSuccess: handleInstantWithdrawSuccess,
    onTransactionHash: tracking.onTransactionHash,
  });

  const withdrawMutation = canInstantWithdraw
    ? instantWithdrawMutation
    : requestWithdrawMutation;

  const withdrawFeesQuery = useTotalWithdrawFees({
    amount: amountBigInt,
  });

  const inputError = getWithdrawErrors({
    amount: amountBigInt,
    nativeBalance,
    stakedBalance,
  });

  const formattedBalance = formatAmount({
    amount: stakedBalance,
    decimals: vusd?.decimals ?? 18,
    isError: isStakedBalanceError,
  });

  const balancesLoaded =
    nativeBalance !== undefined && stakedBalance !== undefined;

  const steps = getWithdrawSteps({
    canInstantWithdraw,
    cooldownDays,
    t,
    withdrawStep,
  });

  function handleMaxClick(maxValue: string) {
    onInputChange(maxValue);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      withdrawMutation.mutate();
    }
  }

  return (
    <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
      <div className="p-6">
        <TokenInput
          balance={
            <Balance
              label={t("pages.earn.stake.available-to-withdraw")}
              value={formattedBalance}
            />
          }
          errorKey={balancesLoaded ? inputError : undefined}
          fiatValue={<RenderFiatValue token={vusd} value={amountBigInt} />}
          label={t("pages.earn.stake.you-will-withdraw")}
          maxButton={
            <SetMaxStakedBalance
              decimals={vusd!.decimals}
              onClick={handleMaxClick}
            />
          }
          onChange={onInputChange}
          tokenSelector={<TokenSelectorReadOnly {...vusd} />}
          value={inputValue}
        />
      </div>

      <div className="flex border-y border-gray-200 bg-gray-50 px-6 py-3 *:flex-1">
        <StakeSubmitButton
          actionText={
            canInstantWithdraw
              ? t("pages.earn.stake.instant-withdraw")
              : t("pages.earn.stake.request-withdrawal")
          }
          balancesLoaded={balancesLoaded}
          inputError={inputError}
          isConnected={isConnected}
          isPending={withdrawMutation.isPending}
          onConnectWallet={openConnectModal}
          pendingText={
            canInstantWithdraw
              ? t("pages.earn.stake.instant-withdrawing")
              : t("pages.earn.stake.requesting")
          }
        />
      </div>
      <CollapsibleSection show={amountBigInt !== 0n}>
        <div className="border-b border-gray-200">
          <NetworkFees
            label={t("pages.earn.stake.withdrawing-fees-label", {
              amount: inputValue,
              token: vusd.symbol,
            })}
            networkFee={withdrawFeesQuery}
            sectionClassName="px-6"
          />
        </div>
      </CollapsibleSection>
      <div className="mt-auto flex flex-col gap-2 px-6">
        <p className="text-xs font-medium tracking-wide text-gray-500">
          {t("pages.earn.stake.withdraw-progress")}
        </p>
        <div className="border-t border-gray-200">
          <VerticalStepper steps={steps} />
        </div>
      </div>
    </form>
  );
}
