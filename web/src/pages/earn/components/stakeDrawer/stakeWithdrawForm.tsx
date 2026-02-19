import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { VerticalStepper, stepStatus } from "components/base/verticalStepper";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { SetMaxStakedBalance } from "components/setMaxStakedBalance";
import { TokenInput } from "components/tokenInput";
import { Balance } from "components/tokenInput/balance";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useInstantWithdraw } from "hooks/useInstantWithdraw";
import { useMainnet } from "hooks/useMainnet";
import { useStakedBalance } from "hooks/useStakedBalance";
import { useStakeWithdraw } from "hooks/useStakeWithdraw";
import { useVusd } from "hooks/useVusd";
import { useCanInstantWithdraw } from "pages/earn/hooks/useCanInstantWithdraw";
import { useWithdrawFees } from "pages/earn/hooks/useWithdrawFees";
import { type FormEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
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

export function StakeWithdrawForm({
  inputValue,
  onInputChange,
  onSuccess,
  onWithdrawStepChange,
  withdrawStep,
}: Props) {
  const { address: account, isConnected } = useAccount();
  const canInstantWithdraw = useCanInstantWithdraw();
  const chain = useMainnet();
  const { openConnectModal } = useConnectModal();
  const { t } = useTranslation();
  const { data: vusd } = useVusd();

  const { data: stakedBalance, isError: isStakedBalanceError } =
    useStakedBalance();

  const { data: nativeBalanceData } = useNativeBalance(chain.id);
  const nativeBalance = nativeBalanceData?.value;

  const amountBigInt = vusd ? parseUnits(inputValue, vusd.decimals) : 0n;

  const handleRequestWithdrawSuccess = useCallback(
    function handleRequestWithdrawSuccess() {
      onSuccess({
        description: t("pages.earn.stake.withdraw-toast-description"),
        title: t("pages.earn.stake.withdraw-toast-title"),
      });
    },
    [onSuccess, t],
  );

  const handleInstantWithdrawSuccess = useCallback(
    function handleInstantWithdrawSuccess() {
      onSuccess({
        description: t("pages.earn.stake.instant-withdraw-toast-description"),
        title: t("pages.earn.stake.instant-withdraw-toast-title"),
      });
    },
    [onSuccess, t],
  );

  const requestWithdrawMutation = useStakeWithdraw({
    assets: amountBigInt,
    onStatusChange: onWithdrawStepChange,
    onSuccess: handleRequestWithdrawSuccess,
  });

  const instantWithdrawMutation = useInstantWithdraw({
    assets: amountBigInt,
    onStatusChange: onWithdrawStepChange,
    onSuccess: handleInstantWithdrawSuccess,
  });

  const withdrawMutation = canInstantWithdraw
    ? instantWithdrawMutation
    : requestWithdrawMutation;

  const { data: networkFee, isError: isFeeError } = useWithdrawFees({
    account,
    amount: amountBigInt,
    isConnected,
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

  const requestStatus = getRequestStepStatus(withdrawStep);

  const steps = canInstantWithdraw
    ? [
        {
          description: t("pages.earn.stake.instant-withdraw-step-description"),
          status: requestStatus,
          title: t("pages.earn.stake.instant-withdraw-step-title"),
        },
      ]
    : [
        {
          description: t("pages.earn.stake.withdraw-step-1-description"),
          status: requestStatus,
          title: t("pages.earn.stake.withdraw-step-1-title"),
        },
        {
          description: t("pages.earn.stake.withdraw-step-2-description"),
          status:
            withdrawStep === "completed"
              ? stepStatus.ready
              : stepStatus.notReady,
          title: t("pages.earn.stake.withdraw-step-2-title"),
        },
        {
          description: t("pages.earn.stake.withdraw-step-3-description"),
          status: stepStatus.notReady,
          title: t("pages.earn.stake.withdraw-step-3-title"),
        },
      ];

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

      <div className="px-6">
        <FeesContainer
          isError={isFeeError}
          label={t("pages.earn.stake.withdrawing-fees-label", {
            amount: inputValue,
            token: vusd.symbol,
          })}
          totalFees={networkFee}
        >
          <FeeDetails
            isError={isFeeError}
            label={t("pages.swap.fees.network-fee")}
            value={networkFee}
          />
        </FeesContainer>
      </div>

      <div className="mt-auto flex flex-col gap-2 px-6">
        <p className="text-xs font-medium tracking-wide text-gray-500">
          {t("pages.earn.stake.withdrawals-progress")}
        </p>
        <div className="border-t border-gray-200">
          <VerticalStepper steps={steps} />
        </div>
      </div>
    </form>
  );
}
