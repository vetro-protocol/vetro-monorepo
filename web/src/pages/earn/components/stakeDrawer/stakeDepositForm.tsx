import { useAddTokenToWallet } from "@hemilabs/react-hooks/useAddTokenToWallet";
import { useAllowance } from "@hemilabs/react-hooks/useAllowance";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { ApproveSection } from "components/approveSection";
import { RenderFiatValue } from "components/base/fiatValue";
import { VerticalStepper, stepStatus } from "components/base/verticalStepper";
import { CollapsibleSection } from "components/collapsibleSection";
import { DrawerFeesContainer } from "components/feesContainer";
import { NetworkFees } from "components/networkFees";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenInput } from "components/tokenInput";
import { Balance } from "components/tokenInput/balance";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useMainnet } from "hooks/useMainnet";
import { useShareToken } from "hooks/useShareToken";
import { useStakeDeposit } from "hooks/useStakeDeposit";
import { useTotalDepositFees } from "pages/earn/hooks/useTotalDepositFees";
import { type FormEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";
import { parseUnits, type Address } from "viem";
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
  peggedToken: Token;
  stakingVaultAddress: Address;
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
    depositStep === "deposit-failed" ||
    depositStep === "depositing"
  ) {
    return stepStatus.completed;
  }
  if (depositStep === "approving") {
    return stepStatus.progress;
  }
  if (depositStep === "approve-failed") {
    return stepStatus.failed;
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
  if (depositStep === "deposit-failed") {
    return stepStatus.failed;
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
  peggedToken,
  stakingVaultAddress,
}: Props) {
  const { address: account, isConnected } = useAccount();
  const chain = useMainnet();
  const { openConnectModal } = useConnectModal();
  const { t } = useTranslation();
  const { data: shareToken } = useShareToken(stakingVaultAddress);

  const { mutate: watchToken } = useAddTokenToWallet({
    token: {
      address: shareToken!.address,
      chainId: chain.id,
      extensions: { logoURI: shareToken!.logoURI },
    },
  });

  const { data: peggedTokenBalance, isError: isPeggedTokenBalanceError } =
    useTokenBalance({
      address: peggedToken.address,
      chainId: chain.id,
    });

  const { data: nativeBalanceData } = useNativeBalance(chain.id);
  const nativeBalance = nativeBalanceData?.value;

  const { data: currentAllowance } = useAllowance({
    owner: account,
    spender: stakingVaultAddress,
    token: peggedToken,
  });

  const amountBigInt = parseUnits(inputValue, peggedToken.decimals);

  const needsApproval =
    currentAllowance !== undefined && currentAllowance < amountBigInt;

  const approveAmount = approve10x ? amountBigInt * 10n : undefined;

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.deposit-text", {
        amount: inputValue,
        symbol: peggedToken.symbol,
      }),
      title: `${t("nav.earn")} · ${t("pages.earn.stake.deposit")}`,
    });

  const handleDepositStepChange = useCallback(
    function handleDepositStepChange(step: DepositStep) {
      onDepositStepChange(step);
      const handlers: Partial<Record<DepositStep, () => void>> = {
        completed: onCompleted,
        "deposit-failed": onFailed,
        depositing: onPending,
      };
      handlers[step]?.();
    },
    [onCompleted, onDepositStepChange, onFailed, onPending],
  );

  const handleDepositSuccess = useCallback(
    function handleDepositSuccess() {
      onSuccess({
        description: t("pages.earn.stake.deposit-toast-description"),
        title: t("pages.earn.stake.deposit-toast-title"),
      });
      watchToken();
    },
    [onSuccess, t, watchToken],
  );

  const depositMutation = useStakeDeposit({
    approveAmount,
    assets: amountBigInt,
    onStatusChange: handleDepositStepChange,
    onSuccess: handleDepositSuccess,
    onTransactionHash,
  });

  const depositFeesQuery = useTotalDepositFees({
    amount: amountBigInt,
    approveAmount,
    token: peggedToken,
  });

  const inputError = getStakeErrors({
    amount: amountBigInt,
    nativeBalance,
    tokenBalance: peggedTokenBalance,
  });

  const formattedBalance = formatAmount({
    amount: peggedTokenBalance,
    decimals: peggedToken.decimals,
    isError: isPeggedTokenBalanceError,
  });

  const balancesLoaded =
    nativeBalance !== undefined && peggedTokenBalance !== undefined;

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
          balance={
            <Balance
              label={t("pages.earn.stake.available-to-deposit")}
              value={formattedBalance}
            />
          }
          errorKey={balancesLoaded ? inputError : undefined}
          fiatValue={
            <RenderFiatValue token={peggedToken} value={amountBigInt} />
          }
          label={t("pages.earn.stake.you-will-stake")}
          maxButton={
            <SetMaxErc20Balance onClick={handleMaxClick} token={peggedToken} />
          }
          onChange={onInputChange}
          tokenSelector={<TokenSelectorReadOnly {...peggedToken} />}
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
      <CollapsibleSection show={amountBigInt !== 0n}>
        <DrawerFeesContainer>
          <ApproveSection active={approve10x} onToggle={onApprove10xToggle} />
        </DrawerFeesContainer>
        <div className="border-b border-gray-200">
          <NetworkFees
            label={t("pages.earn.stake.fees-label", {
              amount: inputValue,
              token: peggedToken.symbol,
            })}
            networkFee={depositFeesQuery}
            sectionClassName="px-6"
          />
        </div>
      </CollapsibleSection>
      <DepositProgress
        approvalCompleted={approvalCompleted}
        depositStep={depositStep}
        hasAmount={amountBigInt > 0n}
        needsApproval={needsApproval}
      />
    </form>
  );
}
