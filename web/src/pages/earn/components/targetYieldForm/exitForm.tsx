import { useDebounce } from "@hemilabs/react-hooks/useDebounce";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import type { Token } from "@vetro-protocol/core";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { RenderFiatValue } from "components/base/fiatValue";
import { CollapsibleSection } from "components/collapsibleSection";
import type { TransactionStep } from "components/earn/transactionProgressDrawer";
import { NetworkFees } from "components/networkFees";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenInput } from "components/tokenInput";
import { TokenBalance } from "components/tokenInput/tokenBalance";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { useConvertToAssets } from "hooks/useConvertToAssets";
import { mainnet } from "networks/mainnet";
import { StakeSubmitButton } from "pages/earn/components/earnForm/stakeSubmitButton";
import { useDepositRequest } from "pages/earn/hooks/targetYieldPool/useDepositRequest";
import { useDepositState } from "pages/earn/hooks/targetYieldPool/useDepositState";
import { useIsOpenToExit } from "pages/earn/hooks/targetYieldPool/useIsOpenToExit";
import { useMaxRequestRedeem } from "pages/earn/hooks/targetYieldPool/useMaxRequestRedeem";
import {
  type RequestExitEmitter,
  useRequestExit,
} from "pages/earn/hooks/targetYieldPool/useRequestExit";
import { useRequestExitFees } from "pages/earn/hooks/targetYieldPool/useRequestExitFees";
import { type FormEvent, Suspense, lazy, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { combineQueryResults } from "utils/queries";
import { parseTokenUnits } from "utils/token";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { EpochEndDateValue } from "./epochEndDateValue";
import { getExitBlockingReason } from "./getExitBlockingReason";
import { getInputError } from "./getInputError";
import { LockNote } from "./lockNote";
import { Review, ReviewRow } from "./review";

const RequestExitProgressDrawer = lazy(() =>
  import("./requestExitProgressDrawer").then((m) => ({
    default: m.RequestExitProgressDrawer,
  })),
);

const reasonKeys = {
  "earlier-exit-pending": "pages.earn.fixed-term.earlier-exit-pending",
  "exit-window-closed": "pages.earn.fixed-term.exit-window-closed",
  "nothing-to-exit": "pages.earn.fixed-term.nothing-to-exit",
} as const;

type Props = {
  inputValue: string;
  isDrawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  onInputChange: (value: string) => void;
  onSuccess: (toast: { description: string; title: string }) => void;
  peggedToken: TokenWithGateway;
  shareToken: Token;
  stakingVaultAddress: Address;
};

export function ExitForm({
  inputValue,
  isDrawerOpen,
  onDrawerOpenChange,
  onInputChange,
  onSuccess,
  peggedToken,
  shareToken,
  stakingVaultAddress,
}: Props) {
  const { address: account } = useAccount();
  const { t } = useTranslation();
  const [exitStep, setExitStep] = useState<TransactionStep>("idle");
  const [requestCloseDrawer, setRequestCloseDrawer] = useState(false);
  const [submitted, setSubmitted] = useState<{
    claimableShares: bigint;
    shares: bigint;
  } | null>(null);

  const shareBalanceQuery = useTokenBalance({
    address: shareToken.address,
    chainId: mainnet.id,
  });
  const nativeBalanceQuery = useNativeBalance(mainnet.id);
  const depositRequestQuery = useDepositRequest(stakingVaultAddress);
  const depositStateQuery = useDepositState(stakingVaultAddress);
  const isOpenToExitQuery = useIsOpenToExit(stakingVaultAddress);
  const maxRequestRedeemQuery = useMaxRequestRedeem(stakingVaultAddress);

  const formState = combineQueryResults({
    results: [
      shareBalanceQuery,
      nativeBalanceQuery,
      depositRequestQuery,
      isOpenToExitQuery,
      maxRequestRedeemQuery,
      depositStateQuery,
    ],
    select([
      shareBalance,
      nativeBalance,
      depositRequest,
      isOpenToExit,
      maxRequestRedeem,
      depositState,
    ]) {
      const claimableShares =
        depositRequest.state === "claimable" ? depositRequest.shares : 0n;
      return {
        availableShares: shareBalance + claimableShares,
        blockingReason: getExitBlockingReason({
          claimableShares,
          isOpenToExit,
          maxRequestRedeem,
          shareBalance,
        }),
        claimableShares,
        isTerminated: depositState !== null && depositState.isTerminated,
        maxRequestRedeem,
        nativeBalance: nativeBalance.value,
      } as const;
    },
  });
  const maxRequestRedeem = formState.data?.maxRequestRedeem;

  const shares = parseTokenUnits(inputValue, shareToken);
  const debouncedShares = parseTokenUnits(useDebounce(inputValue), shareToken);

  const { data: assets, status: assetsStatus } = useConvertToAssets({
    shares: debouncedShares,
    stakingVaultAddress,
  });
  const inputError = getInputError({
    amount: shares,
    balance: formState.data?.availableShares,
    maxRequest: maxRequestRedeem,
    nativeBalance: formState.data?.nativeBalance,
  });

  function getBlockingText() {
    if (isOpenToExitQuery.isError) {
      return t("pages.earn.fixed-term.exit-window-error");
    }
    if (maxRequestRedeemQuery.isError) {
      return t("pages.earn.fixed-term.max-exit-error");
    }
    if (formState.isError) {
      return t("pages.earn.fixed-term.exit-state-error");
    }
    const reason = formState.data?.blockingReason;
    return reason
      ? t(reasonKeys[reason], { symbol: shareToken.symbol })
      : undefined;
  }

  const blockingText = getBlockingText();

  const feeShares = submitted?.shares ?? debouncedShares;

  const requestFeesQuery = useRequestExitFees({
    enabled:
      !blockingText &&
      maxRequestRedeem !== undefined &&
      feeShares <= maxRequestRedeem,
    shares: feeShares,
    stakingVaultAddress,
  });

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.request-exit-text", {
        amount: inputValue,
        symbol: shareToken.symbol,
      }),
      title: `${t("nav.earn")} · ${t("pages.earn.fixed-term.request-exit")}`,
    });

  function handleFailed() {
    setExitStep("failed");
    onFailed();
  }

  function handleRequestExitEmitter(emitter: RequestExitEmitter) {
    emitter.on("user-signed-request-redeem", function (hash) {
      onTransactionHash(hash);
      setExitStep("progress");
      onPending();
    });
    emitter.on("user-signing-request-redeem-error", handleFailed);
    emitter.on("request-redeem-failed", handleFailed);
    emitter.on("request-redeem-failed-validation", handleFailed);
    emitter.on("unexpected-error", handleFailed);
    emitter.on("request-redeem-transaction-reverted", handleFailed);
    emitter.on("request-redeem-transaction-succeeded", function () {
      setExitStep("completed");
      onCompleted();
      const toastKeys = formState.data?.isTerminated
        ? ({
            description:
              "pages.earn.fixed-term.request-exit-terminated-toast-description",
            title: "pages.earn.fixed-term.request-exit-terminated-toast-title",
          } as const)
        : ({
            description: "pages.earn.fixed-term.request-exit-toast-description",
            title: "pages.earn.fixed-term.request-exit-toast-title",
          } as const);
      onSuccess({
        description: t(toastKeys.description, {
          peggedSymbol: peggedToken.symbol,
          shareSymbol: shareToken.symbol,
        }),
        title: t(toastKeys.title),
      });
    });
  }

  const requestExitMutation = useRequestExit({
    onEmitter: handleRequestExitEmitter,
    peggedToken,
    shares,
    stakingVaultAddress,
  });

  const startCloseDrawer = useCallback(() => setRequestCloseDrawer(true), []);

  useCloseOnSuccess({
    onClose: startCloseDrawer,
    success: isDrawerOpen && exitStep === "completed",
  });

  function handleCloseDrawer() {
    setRequestCloseDrawer(false);
    setSubmitted(null);
    onDrawerOpenChange(false);
  }

  function requestExit() {
    setExitStep("idle");
    requestExitMutation.mutate(undefined, { onError: handleFailed });
  }

  function renderProgressDrawer() {
    if (!isDrawerOpen || !submitted) {
      return null;
    }
    return (
      <Drawer onClose={handleCloseDrawer} requestClose={requestCloseDrawer}>
        <Suspense fallback={<DrawerLoader />}>
          <RequestExitProgressDrawer
            claimableShares={submitted.claimableShares}
            networkFee={requestFeesQuery}
            onRetry={exitStep === "failed" ? requestExit : undefined}
            peggedToken={peggedToken}
            shares={submitted.shares}
            shareToken={shareToken}
            stakingVaultAddress={stakingVaultAddress}
            transactionStep={exitStep}
          />
        </Suspense>
      </Drawer>
    );
  }

  function renderFiatValue() {
    if (shares === 0n) {
      return <RenderFiatValue token={peggedToken} value={0n} />;
    }
    return (
      <RenderFiatValue
        queryStatus={assetsStatus}
        token={peggedToken}
        value={assets}
      />
    );
  }

  function renderYouWillReceive() {
    if (shares === 0n) {
      return "-";
    }
    return (
      <RenderCryptoValue
        showSymbol
        status={assetsStatus}
        token={peggedToken}
        value={assets}
      />
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!inputError && account && formState.data) {
      setSubmitted({ claimableShares: formState.data.claimableShares, shares });
      onDrawerOpenChange(true);
      requestExit();
    }
  }

  return (
    <>
      <form className="flex flex-col bg-white" onSubmit={handleSubmit}>
        <div className="p-2">
          <TokenInput
            balance={
              <TokenBalance
                label={t("pages.earn.stake.available-to-withdraw")}
                token={shareToken}
              />
            }
            errorKey={formState.data ? inputError : undefined}
            fiatValue={renderFiatValue()}
            label={t("pages.earn.stake.you-will-withdraw")}
            maxButton={
              <SetMaxErc20Balance onClick={onInputChange} token={shareToken} />
            }
            onChange={onInputChange}
            tokenSelector={<TokenSelectorReadOnly {...shareToken} />}
            value={inputValue}
          />
        </div>
        <div className="flex border-y border-gray-200 p-3 *:flex-1">
          <StakeSubmitButton
            actionText={t("pages.earn.fixed-term.request-exit")}
            blockingText={blockingText}
            inputError={inputError}
            isLoading={formState.isPending}
            isPending={requestExitMutation.isPending}
            pendingText={t("pages.earn.fixed-term.requesting-exit")}
          />
        </div>
        <CollapsibleSection show={shares !== 0n}>
          <div className="border-b border-gray-200">
            <NetworkFees
              label={t("pages.earn.fixed-term.request-exit-fees-label", {
                amount: inputValue,
                token: shareToken.symbol,
              })}
              networkFee={requestFeesQuery}
              sectionClassName="px-2"
            />
          </div>
        </CollapsibleSection>
        <LockNote
          getNote={(date) =>
            t("pages.earn.fixed-term.exit-note", {
              date,
              symbol: peggedToken.symbol,
            })
          }
          lines={1}
          stakingVaultAddress={stakingVaultAddress}
        />
        <Review title={t("pages.earn.fixed-term.exit-review")}>
          <ReviewRow
            info={t("pages.earn.fixed-term.you-will-receive-info")}
            label={t("pages.earn.stake.you-will-receive")}
            value={renderYouWillReceive()}
          />
          <ReviewRow
            info={t("pages.earn.fixed-term.available-after-info", {
              symbol: peggedToken.symbol,
            })}
            label={t("pages.earn.fixed-term.available-after")}
            value={
              <EpochEndDateValue stakingVaultAddress={stakingVaultAddress} />
            }
          />
        </Review>
      </form>
      {renderProgressDrawer()}
    </>
  );
}
