import { useDebounce } from "@hemilabs/react-hooks/useDebounce";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useNeedsApproval } from "@hemilabs/react-hooks/useNeedsApproval";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import type { Token } from "@vetro-protocol/core";
import { ApproveSection } from "components/approveSection";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { RenderFiatValue } from "components/base/fiatValue";
import { CollapsibleSection } from "components/collapsibleSection";
import { NetworkFees } from "components/networkFees";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenInput } from "components/tokenInput";
import { TokenBalance } from "components/tokenInput/tokenBalance";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { mainnet } from "networks/mainnet";
import type { DepositStep } from "pages/earn/components/earnForm/stakeFormReducer";
import { StakeSubmitButton } from "pages/earn/components/earnForm/stakeSubmitButton";
import {
  type RequestDepositEmitter,
  useRequestDeposit,
} from "pages/earn/hooks/targetYieldPool/useRequestDeposit";
import { useRequestDepositFees } from "pages/earn/hooks/targetYieldPool/useRequestDepositFees";
import { type FormEvent, Suspense, lazy, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { combineQueryResults } from "utils/queries";
import { parseTokenUnits } from "utils/token";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { EpochEndDateValue } from "./epochEndDateValue";
import { EstimatedYieldValue } from "./estimatedYieldValue";
import { getInputError } from "./getInputError";
import { LockNote } from "./lockNote";
import { Review, ReviewRow } from "./review";
import { SharesToReceiveValue } from "./sharesToReceiveValue";
import { TargetAprValue } from "./targetAprValue";
import { useDepositBlockingText } from "./useDepositBlockingText";

const RequestDepositProgressDrawer = lazy(() =>
  import("./requestDepositProgressDrawer").then((m) => ({
    default: m.RequestDepositProgressDrawer,
  })),
);

type Props = {
  approvalCompleted: boolean;
  approve10x: boolean;
  depositStep: DepositStep;
  inputValue: string;
  isDrawerOpen: boolean;
  onApprove10xToggle: VoidFunction;
  onDepositStepChange: (step: DepositStep) => void;
  onDrawerOpenChange: (open: boolean) => void;
  onInputChange: (value: string) => void;
  onResetSteps: VoidFunction;
  onSuccess: (toast: { description: string; title: string }) => void;
  peggedToken: TokenWithGateway;
  shareToken: Token;
  stakingVaultAddress: Address;
};

const getSubmitTexts = ({
  depositStep,
  needsApproval,
  t,
}: {
  depositStep: DepositStep;
  needsApproval: boolean | undefined;
  t: ReturnType<typeof useTranslation>["t"];
}) => ({
  actionText: needsApproval
    ? t("pages.earn.fixed-term.approve-and-request-deposit")
    : t("pages.earn.fixed-term.request-deposit"),
  pendingText:
    depositStep === "approving"
      ? t("pages.earn.stake.approving")
      : t("pages.earn.fixed-term.requesting-deposit"),
});

export function DepositForm({
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

  const amount = parseTokenUnits(inputValue, peggedToken);
  const debouncedAmount = parseTokenUnits(useDebounce(inputValue), peggedToken);

  const peggedTokenBalanceQuery = useTokenBalance({
    address: peggedToken.address,
    chainId: mainnet.id,
  });
  const nativeBalanceQuery = useNativeBalance(mainnet.id);
  const needsApprovalQuery = useNeedsApproval({
    amount,
    spender: stakingVaultAddress,
    token: peggedToken,
  });
  const depositAvailabilityQuery = useDepositBlockingText(stakingVaultAddress);

  const formState = combineQueryResults({
    results: [
      peggedTokenBalanceQuery,
      nativeBalanceQuery,
      needsApprovalQuery,
      depositAvailabilityQuery,
    ],
    select: ([
      peggedTokenBalance,
      nativeBalance,
      needsApproval,
      depositAvailability,
    ]) => ({
      ...depositAvailability,
      nativeBalance: nativeBalance.value,
      needsApproval,
      peggedTokenBalance,
    }),
  });
  const needsApproval = formState.data?.needsApproval;

  const blockingText = formState.isError
    ? t("pages.earn.fixed-term.deposit-state-error")
    : formState.data?.blockingText;

  const maxRequestDeposit = formState.data?.maxRequestDeposit;
  const requestFeesQuery = useRequestDepositFees({
    amount: debouncedAmount,
    approveAmount: approve10x ? debouncedAmount * 10n : undefined,
    enabled:
      !blockingText &&
      maxRequestDeposit !== undefined &&
      debouncedAmount <= maxRequestDeposit,
    stakingVaultAddress,
    token: peggedToken,
  });

  const inputError = getInputError({
    amount,
    balance: formState.data?.peggedTokenBalance,
    maxRequest: maxRequestDeposit,
    nativeBalance: formState.data?.nativeBalance,
  });

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.request-deposit-text", {
        amount: inputValue,
        symbol: peggedToken.symbol,
      }),
      title: `${t("nav.earn")} · ${t("pages.earn.fixed-term.request-deposit")}`,
    });

  function handleDepositStepChange(step: DepositStep) {
    onDepositStepChange(step);
    const handlers: Partial<Record<DepositStep, () => void>> = {
      completed: onCompleted,
      "deposit-failed": onFailed,
      depositing: onPending,
    };
    handlers[step]?.();
  }

  function handleRequestDepositSuccess() {
    onSuccess({
      description: t(
        "pages.earn.fixed-term.request-deposit-toast-description",
        {
          peggedSymbol: peggedToken.symbol,
          shareSymbol: shareToken.symbol,
        },
      ),
      title: t("pages.earn.fixed-term.request-deposit-toast-title"),
    });
  }

  const initialFailedStep: DepositStep = needsApproval
    ? "approve-failed"
    : "deposit-failed";

  function handleRequestDepositEmitter(emitter: RequestDepositEmitter) {
    let failedStep = initialFailedStep;

    function handleFailed() {
      handleDepositStepChange(failedStep);
    }

    emitter.on("pre-approve", function () {
      failedStep = "approve-failed";
    });
    emitter.on("user-signed-approval", () =>
      handleDepositStepChange("approving"),
    );
    emitter.on("user-signing-approval-error", handleFailed);
    emitter.on("approve-transaction-reverted", handleFailed);
    emitter.on("approve-transaction-succeeded", () =>
      handleDepositStepChange("approved"),
    );
    emitter.on("pre-request-deposit", function () {
      failedStep = "deposit-failed";
    });
    emitter.on("user-signed-request-deposit", function (hash) {
      onTransactionHash(hash);
      handleDepositStepChange("depositing");
    });
    emitter.on("user-signing-request-deposit-error", handleFailed);
    emitter.on("request-deposit-failed", handleFailed);
    emitter.on("request-deposit-failed-validation", handleFailed);
    emitter.on("unexpected-error", handleFailed);
    emitter.on("request-deposit-transaction-reverted", handleFailed);
    emitter.on("request-deposit-transaction-succeeded", function () {
      handleDepositStepChange("completed");
      handleRequestDepositSuccess();
    });
  }

  const requestDepositMutation = useRequestDeposit({
    approveAmount: approve10x ? amount * 10n : undefined,
    assets: amount,
    onEmitter: handleRequestDepositEmitter,
    peggedToken,
    stakingVaultAddress,
  });

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

  function requestDeposit() {
    requestDepositMutation.mutate(undefined, {
      onError: () => handleDepositStepChange(initialFailedStep),
    });
  }

  function handleRetry() {
    onDepositStepChange(approvalCompleted ? "approved" : "idle");
    requestDeposit();
  }

  const isDepositFailed =
    depositStep === "approve-failed" || depositStep === "deposit-failed";

  function renderProgressDrawer() {
    if (!isDrawerOpen || !submitted) {
      return null;
    }
    return (
      <Drawer onClose={handleCloseDrawer} requestClose={requestCloseDrawer}>
        <Suspense fallback={<DrawerLoader />}>
          <RequestDepositProgressDrawer
            amount={submitted.amount}
            approvalCompleted={approvalCompleted}
            assets={submitted.assets}
            depositStep={depositStep}
            needsApproval={needsApproval}
            networkFee={requestFeesQuery}
            onRetry={isDepositFailed ? handleRetry : undefined}
            peggedToken={peggedToken}
            shareToken={shareToken}
            stakingVaultAddress={stakingVaultAddress}
          />
        </Suspense>
      </Drawer>
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError && account) {
      setSubmitted({ amount: inputValue, assets: amount });
      onResetSteps();
      onDrawerOpenChange(true);
      requestDeposit();
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
            errorKey={formState.data ? inputError : undefined}
            fiatValue={<RenderFiatValue token={peggedToken} value={amount} />}
            label={t("pages.earn.stake.you-will-stake")}
            maxButton={
              <SetMaxErc20Balance onClick={onInputChange} token={peggedToken} />
            }
            onChange={onInputChange}
            tokenSelector={<TokenSelectorReadOnly {...peggedToken} />}
            value={inputValue}
          />
        </div>
        <div className="flex border-y border-gray-200 p-3 *:flex-1">
          <StakeSubmitButton
            actionText={actionText}
            blockingText={blockingText}
            inputError={inputError}
            isLoading={formState.isPending}
            isPending={requestDepositMutation.isPending}
            pendingText={pendingText}
          />
        </div>
        <CollapsibleSection show={debouncedAmount !== 0n}>
          <div className="w-full border-b border-gray-200 px-2">
            <ApproveSection active={approve10x} onToggle={onApprove10xToggle} />
          </div>
          <div className="border-b border-gray-200">
            <NetworkFees
              label={t("pages.earn.stake.fees-label", {
                amount: inputValue,
                token: peggedToken.symbol,
              })}
              networkFee={requestFeesQuery}
              sectionClassName="px-2"
            />
          </div>
        </CollapsibleSection>
        <LockNote
          getNote={(date) =>
            t("pages.earn.fixed-term.locked-note", {
              date,
              symbol: peggedToken.symbol,
            })
          }
          lines={2}
          stakingVaultAddress={stakingVaultAddress}
        />
        <Review title={t("pages.earn.fixed-term.deposit-review")}>
          <ReviewRow
            info={t("pages.earn.fixed-term.you-will-receive-info")}
            label={t("pages.earn.stake.you-will-receive")}
            value={
              <SharesToReceiveValue
                amount={amount}
                debouncedAmount={debouncedAmount}
                shareToken={shareToken}
                stakingVaultAddress={stakingVaultAddress}
              />
            }
          />
          <ReviewRow
            info={t("pages.earn.fixed-term.entry-apr-info")}
            label={t("pages.earn.fixed-term.entry-apr")}
            value={<TargetAprValue stakingVaultAddress={stakingVaultAddress} />}
          />
          <ReviewRow
            info={t("pages.earn.fixed-term.estimated-yield-info")}
            label={t("pages.earn.fixed-term.estimated-yield")}
            value={
              <EstimatedYieldValue
                amount={amount}
                peggedToken={peggedToken}
                stakingVaultAddress={stakingVaultAddress}
              />
            }
          />
          <ReviewRow
            info={t("pages.earn.fixed-term.locked-until-info")}
            label={t("pages.earn.fixed-term.locked-until")}
            value={
              <EpochEndDateValue stakingVaultAddress={stakingVaultAddress} />
            }
          />
          <ReviewRow
            info={t("pages.earn.fixed-term.at-term-end-info")}
            label={t("pages.earn.fixed-term.at-term-end")}
            value={t("pages.earn.fixed-term.rolls-into-next-term")}
          />
        </Review>
      </form>
      {renderProgressDrawer()}
    </>
  );
}
