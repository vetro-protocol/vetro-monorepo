import { useQuery } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { Button } from "components/base/button";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Toast } from "components/base/toast";
import type { TransactionStep } from "components/earn/transactionProgressDrawer";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useNowTickingPast } from "hooks/useNowTickingPast";
import {
  type CancelExitRequestEmitter,
  useCancelExitRequest,
} from "pages/earn/hooks/targetYieldPool/useCancelExitRequest";
import { useCancelExitRequestFees } from "pages/earn/hooks/targetYieldPool/useCancelExitRequestFees";
import { epochOptions } from "pages/earn/hooks/targetYieldPool/useEpoch";
import { useEpochId } from "pages/earn/hooks/targetYieldPool/useEpochId";
import { useRedeemRequest } from "pages/earn/hooks/targetYieldPool/useRedeemRequest";
import { Suspense, lazy, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount } from "utils/token";
import type { Address } from "viem";

const CancelExitProgressDrawer = lazy(() =>
  import("components/earn/cancelExitProgressDrawer").then((m) => ({
    default: m.CancelExitProgressDrawer,
  })),
);

// The redeem request key does not change when the exit window ends during
// shutdown, so the cached canCancel can outlive the contract's window check.
function useCanCancel({
  canCancel,
  stakingVaultAddress,
}: {
  canCancel: boolean | undefined;
  stakingVaultAddress: Address;
}) {
  const client = useEthereumClient();
  const { data: epochId } = useEpochId(stakingVaultAddress);
  const { data: exitWindowEnd } = useQuery({
    ...epochOptions({ client, epochId, stakingVaultAddress }),
    select: (epoch) => epoch.exitWindow.end,
  });
  const now = useNowTickingPast(
    exitWindowEnd === undefined ? undefined : [exitWindowEnd],
    Number,
  );
  return (
    !!canCancel && exitWindowEnd !== undefined && BigInt(now) < exitWindowEnd
  );
}

type Props = {
  peggedToken: Token;
  shareToken: Token;
  stakingVaultAddress: Address;
};

export const CancelExitRequest = function ({
  peggedToken,
  shareToken,
  stakingVaultAddress,
}: Props) {
  const { t } = useTranslation();
  const { data } = useRedeemRequest(stakingVaultAddress);
  const shares = data?.shares ?? 0n;
  const canCancel = useCanCancel({
    canCancel: data?.canCancel,
    stakingVaultAddress,
  });
  const [cancelStep, setCancelStep] = useState<TransactionStep>("idle");
  const [requestCloseDrawer, setRequestCloseDrawer] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [submitted, setSubmitted] = useState<{
    assets: bigint;
    shares: bigint;
  } | null>(null);

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.cancel-exit-text", {
        amount: formatAmount({
          amount: shares,
          decimals: shareToken.decimals,
          isError: false,
        }),
        symbol: shareToken.symbol,
      }),
      title: `${t("nav.earn")} · ${t("pages.earn.fixed-term.cancel-exit-request")}`,
    });

  function handleFailed() {
    setCancelStep("failed");
    onFailed();
  }

  function handleCancelExitRequestEmitter(emitter: CancelExitRequestEmitter) {
    emitter.on("user-signed-cancel-redeem-request", function (hash) {
      onTransactionHash(hash);
      setCancelStep("progress");
      onPending();
    });
    emitter.on("user-signing-cancel-redeem-request-error", handleFailed);
    emitter.on("cancel-redeem-request-failed", handleFailed);
    emitter.on("cancel-redeem-request-failed-validation", handleFailed);
    emitter.on("unexpected-error", handleFailed);
    emitter.on("cancel-redeem-request-transaction-reverted", handleFailed);
    emitter.on("cancel-redeem-request-transaction-succeeded", function () {
      setCancelStep("completed");
      onCompleted();
      setShowToast(true);
    });
  }

  const networkFee = useCancelExitRequestFees({
    enabled: submitted !== null && (canCancel || cancelStep === "completed"),
    stakingVaultAddress,
  });

  const cancelExitRequestMutation = useCancelExitRequest({
    chainId: peggedToken.chainId,
    onEmitter: handleCancelExitRequestEmitter,
    shares,
    stakingVaultAddress,
  });

  const startCloseDrawer = useCallback(() => setRequestCloseDrawer(true), []);

  useCloseOnSuccess({
    onClose: startCloseDrawer,
    success: submitted !== null && cancelStep === "completed",
  });

  const cancel = function () {
    setCancelStep("idle");
    cancelExitRequestMutation.mutate(undefined, { onError: handleFailed });
  };

  const handleCancel = function () {
    if (!canCancel || !data) {
      return;
    }
    setSubmitted({ assets: data.amount, shares: data.shares });
    cancel();
  };

  const handleCloseDrawer = function () {
    setRequestCloseDrawer(false);
    setSubmitted(null);
  };

  return (
    <>
      <Button
        disabled={!canCancel || cancelExitRequestMutation.isPending}
        onClick={handleCancel}
        type="button"
        variant="secondary"
      >
        {t("pages.earn.fixed-term.cancel")}
      </Button>
      {submitted ? (
        <Drawer onClose={handleCloseDrawer} requestClose={requestCloseDrawer}>
          <Suspense fallback={<DrawerLoader />}>
            <CancelExitProgressDrawer
              assets={submitted.assets}
              networkFee={networkFee}
              onRetry={
                cancelStep === "failed" && canCancel ? cancel : undefined
              }
              peggedToken={peggedToken}
              shares={submitted.shares}
              shareToken={shareToken}
              transactionStep={cancelStep}
            />
          </Suspense>
        </Drawer>
      ) : null}
      {showToast ? (
        <Toast
          autoClose
          description={t(
            "pages.earn.fixed-term.cancel-exit-toast-description",
            {
              shareSymbol: shareToken.symbol,
            },
          )}
          onClose={() => setShowToast(false)}
          title={t("pages.earn.fixed-term.cancel-exit-toast-title")}
        />
      ) : null}
    </>
  );
};
