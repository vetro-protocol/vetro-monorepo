import { useAllowance } from "@hemilabs/react-hooks/useAllowance";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import type { Token } from "@vetro-protocol/core";
import { ApproveSection } from "components/approveSection";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { RenderFiatValue } from "components/base/fiatValue";
import type { ToastContent } from "components/base/toast";
import { CollapsibleSection } from "components/collapsibleSection";
import { NetworkFees } from "components/networkFees";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenInput } from "components/tokenInput";
import { TokenBalance } from "components/tokenInput/tokenBalance";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { useStakeDeposit } from "hooks/useStakeDeposit";
import { mainnet } from "networks/mainnet";
import type { DepositStep } from "pages/earn/components/earnForm/stakeFormReducer";
import { StakeSubmitButton } from "pages/earn/components/earnForm/stakeSubmitButton";
import { useStakeDepositTracking } from "pages/earn/hooks/useStakeDepositTracking";
import { useTotalDepositFees } from "pages/earn/hooks/useTotalDepositFees";
import { type FormEvent, Suspense, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { lazyWithReload } from "utils/lazyWithReload";
import { type Address, parseUnits } from "viem";
import { useAccount } from "wagmi";

const StakeDepositProgressDrawer = lazyWithReload(() =>
  import("./stakeDepositProgressDrawer").then((m) => ({
    default: m.StakeDepositProgressDrawer,
  })),
);

type Props = {
  approve10x: boolean;
  approvalCompleted: boolean;
  depositStep: DepositStep;
  inputValue: string;
  isDrawerOpen: boolean;
  onApprove10xToggle: VoidFunction;
  onDepositStepChange: (step: DepositStep) => void;
  onDrawerOpenChange: (open: boolean) => void;
  onInputChange: (value: string) => void;
  onResetSteps: VoidFunction;
  onSuccess: (toast: ToastContent) => void;
  peggedToken: TokenWithGateway;
  shareToken: Token;
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

const getSubmitTexts = ({
  depositStep,
  needsApproval,
  t,
}: {
  depositStep: DepositStep;
  needsApproval: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) => ({
  actionText: needsApproval
    ? t("pages.earn.stake.approve-and-deposit")
    : t("pages.earn.stake.deposit"),
  pendingText:
    depositStep === "approving"
      ? t("pages.earn.stake.approving")
      : t("pages.earn.stake.depositing"),
});

export function StakeDepositForm({
  approvalCompleted,
  approve10x,
  depositStep,
  inputValue,
  isDrawerOpen,
  onApprove10xToggle,
  onDepositStepChange,
  onDrawerOpenChange,
  onInputChange,
  onResetSteps,
  onSuccess,
  peggedToken,
  shareToken,
  stakingVaultAddress,
}: Props) {
  const { address: account } = useAccount();
  const { t } = useTranslation();
  const [requestCloseDrawer, setRequestCloseDrawer] = useState(false);
  const [submitted, setSubmitted] = useState<{
    amount: string;
    assets: bigint;
  } | null>(null);

  const { data: peggedTokenBalance } = useTokenBalance({
    address: peggedToken.address,
    chainId: mainnet.id,
  });

  const { data: nativeBalanceData } = useNativeBalance(mainnet.id);
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

  const { onTransactionHash, trackStep } = useStakeDepositTracking({
    amount: inputValue,
    onSuccess,
    shareToken,
    symbol: peggedToken.symbol,
  });

  const handleDepositStepChange = useCallback(
    function handleDepositStepChange(step: DepositStep) {
      onDepositStepChange(step);
      trackStep(step);
    },
    [onDepositStepChange, trackStep],
  );

  const depositMutation = useStakeDeposit({
    onStatusChange: ({ status }) => handleDepositStepChange(status),
    onTransactionHash: ({ hash }) => onTransactionHash(hash),
  });

  const depositFeesQuery = useTotalDepositFees({
    amount: amountBigInt,
    approveAmount,
    stakingVaultAddress,
    token: peggedToken,
  });

  const inputError = getStakeErrors({
    amount: amountBigInt,
    nativeBalance,
    tokenBalance: peggedTokenBalance,
  });

  const balancesLoaded =
    nativeBalance !== undefined && peggedTokenBalance !== undefined;

  const { actionText, pendingText } = getSubmitTexts({
    depositStep,
    needsApproval,
    t,
  });

  const startCloseDrawer = useCallback(() => setRequestCloseDrawer(true), []);

  useCloseOnSuccess({
    onClose: startCloseDrawer,
    success: isDrawerOpen && depositStep === "completed",
  });

  function handleCloseDrawer() {
    setRequestCloseDrawer(false);
    onDrawerOpenChange(false);
  }

  function handleMaxClick(maxValue: string) {
    onInputChange(maxValue);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError && account) {
      setSubmitted({ amount: inputValue, assets: amountBigInt });
      onResetSteps();
      onDrawerOpenChange(true);
      depositMutation.mutate(
        {
          account,
          approveAmount,
          assets: amountBigInt,
          peggedToken,
          stakingVaultAddress,
        },
        {
          onError: () =>
            handleDepositStepChange(
              needsApproval ? "approve-failed" : "deposit-failed",
            ),
        },
      );
    }
  }

  return (
    <>
      <form className="flex flex-col bg-white" onSubmit={handleSubmit}>
        <div className="p-2">
          <TokenInput
            balance={
              <TokenBalance
                label={t("pages.earn.stake.available-to-deposit")}
                token={peggedToken}
              />
            }
            errorKey={balancesLoaded ? inputError : undefined}
            fiatValue={
              <RenderFiatValue token={peggedToken} value={amountBigInt} />
            }
            label={t("pages.earn.stake.you-will-stake")}
            maxButton={
              <SetMaxErc20Balance
                onClick={handleMaxClick}
                token={peggedToken}
              />
            }
            onChange={onInputChange}
            tokenSelector={<TokenSelectorReadOnly {...peggedToken} />}
            value={inputValue}
          />
        </div>
        <div className="flex border-y border-gray-200 p-3 *:flex-1">
          <StakeSubmitButton
            actionText={actionText}
            inputError={inputError}
            isLoading={!balancesLoaded}
            isPending={depositMutation.isPending}
            pendingText={pendingText}
          />
        </div>
        <CollapsibleSection show={amountBigInt !== 0n}>
          <div className="w-full border-b border-gray-200 px-2">
            <ApproveSection active={approve10x} onToggle={onApprove10xToggle} />
          </div>
          <div className="border-b border-gray-200">
            <NetworkFees
              label={t("pages.earn.stake.fees-label", {
                amount: inputValue,
                token: peggedToken.symbol,
              })}
              networkFee={depositFeesQuery}
              sectionClassName="px-2"
            />
          </div>
        </CollapsibleSection>
      </form>
      {isDrawerOpen && submitted && (
        <Drawer
          onClose={handleCloseDrawer}
          requestClose={requestCloseDrawer}
          title={t("pages.earn.stake.deposit-in-progress")}
        >
          <Suspense fallback={<DrawerLoader />}>
            <StakeDepositProgressDrawer
              amount={submitted.amount}
              approvalCompleted={approvalCompleted}
              assets={submitted.assets}
              depositStep={depositStep}
              needsApproval={needsApproval}
              networkFee={depositFeesQuery}
              peggedToken={peggedToken}
              shareToken={shareToken}
              stakingVaultAddress={stakingVaultAddress}
            />
          </Suspense>
        </Drawer>
      )}
    </>
  );
}
