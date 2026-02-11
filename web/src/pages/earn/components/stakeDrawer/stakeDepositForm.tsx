import { useAllowance } from "@hemilabs/react-hooks/useAllowance";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { getStakingVaultAddress } from "@vetro/earn";
import { ApproveSection } from "components/approveSection";
import { VerticalStepper, stepStatus } from "components/base/verticalStepper";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenInput } from "components/tokenInput";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useMainnet } from "hooks/useMainnet";
import { useStakeDeposit } from "hooks/useStakeDeposit";
import { useVusd } from "hooks/useVusd";
import { useDepositFees } from "pages/earn/hooks/useDepositFees";
import { type FormEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount } from "utils/token";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";

import type { DepositStep } from "./stakeDrawerReducer";
import { StakeSubmitButton } from "./stakeSubmitButton";

type Props = {
  approve10x: boolean;
  approvalCompleted: boolean;
  depositStep: DepositStep;
  inputValue: string;
  onApprove10xToggle: VoidFunction;
  onDepositStepChange: (step: DepositStep) => void;
  onInputChange: (value: string) => void;
  onSuccess: (toast: { description: string; title: string }) => void;
};

function getStakeErrors({
  amount,
  nativeBalance,
  tokenBalance,
}: {
  amount: bigint;
  nativeBalance: bigint | undefined;
  tokenBalance: bigint | undefined;
}) {
  if (amount === 0n) {
    return "enter-amount";
  }
  if (tokenBalance !== undefined && amount > tokenBalance) {
    return "insufficient-balance";
  }
  if (nativeBalance !== undefined && nativeBalance === 0n) {
    return "insufficient-gas";
  }
  return undefined;
}

function getApproveStepStatus(depositStep: DepositStep) {
  if (
    depositStep === "approved" ||
    depositStep === "completed" ||
    depositStep === "depositing"
  ) {
    return stepStatus.completed;
  }
  if (depositStep === "approving") {
    return stepStatus.progress;
  }
  return stepStatus.ready;
}

function getConfirmStepStatus(depositStep: DepositStep) {
  if (depositStep === "completed") {
    return stepStatus.completed;
  }
  if (depositStep === "depositing") {
    return stepStatus.progress;
  }
  if (depositStep === "approved") {
    return stepStatus.ready;
  }
  return stepStatus.notReady;
}

function DepositProgress({
  approvalCompleted,
  depositStep,
  hasAmount,
  needsApproval,
}: {
  approvalCompleted: boolean;
  depositStep: DepositStep;
  hasAmount: boolean;
  needsApproval: boolean;
}) {
  const { t } = useTranslation();

  const approveStatus = getApproveStepStatus(depositStep);
  const confirmStatus = getConfirmStepStatus(depositStep);

  const approvalInProgress =
    depositStep === "approving" || depositStep === "approved";
  const showBothSteps =
    (depositStep === "completed" && approvalCompleted) ||
    (depositStep !== "completed" &&
      (needsApproval || !hasAmount || approvalInProgress || approvalCompleted));

  const steps = showBothSteps
    ? [
        {
          description: t("pages.earn.stake.deposit-step-approve-description"),
          status: approveStatus,
          title: t("pages.earn.stake.deposit-step-approve-title"),
        },
        {
          description: t("pages.earn.stake.deposit-step-confirm-description"),
          status: confirmStatus,
          title: t("pages.earn.stake.deposit-step-confirm-title"),
        },
      ]
    : [
        {
          description: t("pages.earn.stake.deposit-step-confirm-description"),
          status:
            confirmStatus === stepStatus.notReady
              ? stepStatus.ready
              : confirmStatus,
          title: t("pages.earn.stake.deposit-step-confirm-title"),
        },
      ];

  return (
    <div className="mt-auto flex flex-col gap-2 px-6">
      <p className="text-xs font-medium tracking-wide text-gray-500">
        {t("pages.earn.stake.deposit-progress")}
      </p>
      <div className="border-t border-gray-200">
        <VerticalStepper steps={steps} />
      </div>
    </div>
  );
}

export function StakeDepositForm({
  approvalCompleted,
  approve10x,
  depositStep,
  inputValue,
  onApprove10xToggle,
  onDepositStepChange,
  onInputChange,
  onSuccess,
}: Props) {
  const { address: account, isConnected } = useAccount();
  const chain = useMainnet();
  const { openConnectModal } = useConnectModal();
  const { t } = useTranslation();
  const { data: vusd } = useVusd();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);

  const { data: vusdBalance, isError: isVusdBalanceError } = useTokenBalance({
    address: vusd?.address,
    chainId: chain.id,
  });

  const { data: nativeBalanceData } = useNativeBalance(chain.id);
  const nativeBalance = nativeBalanceData?.value;

  const { data: currentAllowance } = useAllowance({
    owner: account,
    spender: stakingVaultAddress,
    token: vusd,
  });

  const amountBigInt = vusd ? parseUnits(inputValue, vusd.decimals) : 0n;

  const needsApproval =
    currentAllowance !== undefined && currentAllowance < amountBigInt;

  const approveAmount = approve10x ? amountBigInt * 10n : undefined;

  const handleDepositSuccess = useCallback(
    function handleDepositSuccess() {
      onSuccess({
        description: t("pages.earn.stake.deposit-toast-description"),
        title: t("pages.earn.stake.deposit-toast-title"),
      });
    },
    [onSuccess, t],
  );

  const depositMutation = useStakeDeposit({
    approveAmount,
    assets: amountBigInt,
    onStatusChange: onDepositStepChange,
    onSuccess: handleDepositSuccess,
  });

  const { data: networkFee, isError: isFeeError } = useDepositFees({
    account,
    amount: amountBigInt,
    isConnected,
    token: vusd,
  });

  const inputError = getStakeErrors({
    amount: amountBigInt,
    nativeBalance,
    tokenBalance: vusdBalance,
  });

  const formattedBalance = formatAmount({
    amount: vusdBalance,
    decimals: vusd.decimals,
    isError: isVusdBalanceError,
  });

  const balancesLoaded =
    nativeBalance !== undefined && vusdBalance !== undefined;

  const actionText = needsApproval
    ? t("pages.earn.stake.approve-and-deposit")
    : t("pages.earn.stake.deposit");

  const pendingText =
    depositStep === "approving"
      ? t("pages.earn.stake.approving")
      : t("pages.earn.stake.depositing");

  function handleMaxClick(maxValue: string) {
    onInputChange(maxValue);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError) {
      depositMutation.mutate();
    }
  }

  return (
    <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
      <div className="p-6">
        <TokenInput
          balanceLabel={t("pages.earn.stake.available-to-deposit")}
          balanceValue={formattedBalance}
          errorKey={balancesLoaded ? inputError : undefined}
          label={t("pages.earn.stake.you-will-stake")}
          maxButton={
            <SetMaxErc20Balance onClick={handleMaxClick} token={vusd!} />
          }
          onChange={onInputChange}
          tokenSelector={<TokenSelectorReadOnly {...vusd} />}
          value={inputValue}
        />
      </div>

      <div className="flex border-y border-gray-200 bg-gray-50 px-6 py-3 *:flex-1">
        <StakeSubmitButton
          actionText={actionText}
          balancesLoaded={balancesLoaded}
          inputError={inputError}
          isConnected={isConnected}
          isPending={depositMutation.isPending}
          onConnectWallet={openConnectModal}
          pendingText={pendingText}
        />
      </div>

      <div className="px-6">
        <ApproveSection active={approve10x} onToggle={onApprove10xToggle} />
        <FeesContainer
          isError={isFeeError}
          label={t("pages.earn.stake.fees-label", {
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

      <DepositProgress
        approvalCompleted={approvalCompleted}
        depositStep={depositStep}
        hasAmount={amountBigInt > 0n}
        needsApproval={needsApproval}
      />
    </form>
  );
}
