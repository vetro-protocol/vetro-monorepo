import type { Token } from "@vetro-protocol/core";
import { Button } from "components/base/button";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Toast } from "components/base/toast";
import type { TransactionStep } from "components/earn/transactionProgressDrawer";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import {
  type CancelDepositRequestEmitter,
  useCancelDepositRequest,
} from "pages/earn/hooks/targetYieldPool/useCancelDepositRequest";
import { useCancelDepositRequestFees } from "pages/earn/hooks/targetYieldPool/useCancelDepositRequestFees";
import { useDepositRequest } from "pages/earn/hooks/targetYieldPool/useDepositRequest";
import { Suspense, lazy, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount } from "utils/token";
import type { Address } from "viem";

const CancelDepositProgressDrawer = lazy(() =>
  import("components/earn/cancelDepositProgressDrawer").then((m) => ({
    default: m.CancelDepositProgressDrawer,
  })),
);

type Props = {
  peggedToken: Token;
  stakingVaultAddress: Address;
};

export const CancelDepositRequest = function ({
  peggedToken,
  stakingVaultAddress,
}: Props) {
  const { t } = useTranslation();
  const { data } = useDepositRequest(stakingVaultAddress);
  const amount = data?.amount ?? 0n;
  const canCancel = !!data?.canCancel;
  const [cancelStep, setCancelStep] = useState<TransactionStep>("idle");
  const [requestCloseDrawer, setRequestCloseDrawer] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [submitted, setSubmitted] = useState<{ assets: bigint } | null>(null);

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.cancel-deposit-text", {
        amount: formatAmount({
          amount,
          decimals: peggedToken.decimals,
          isError: false,
        }),
        symbol: peggedToken.symbol,
      }),
      title: `${t("nav.earn")} · ${t("pages.earn.fixed-term.cancel-deposit-request")}`,
    });

  function handleFailed() {
    setCancelStep("failed");
    onFailed();
  }

  function handleCancelDepositRequestEmitter(
    emitter: CancelDepositRequestEmitter,
  ) {
    emitter.on("user-signed-cancel-deposit-request", function (hash) {
      onTransactionHash(hash);
      setCancelStep("progress");
      onPending();
    });
    emitter.on("user-signing-cancel-deposit-request-error", handleFailed);
    emitter.on("cancel-deposit-request-failed", handleFailed);
    emitter.on("cancel-deposit-request-failed-validation", handleFailed);
    emitter.on("unexpected-error", handleFailed);
    emitter.on("cancel-deposit-request-transaction-reverted", handleFailed);
    emitter.on("cancel-deposit-request-transaction-succeeded", function () {
      setCancelStep("completed");
      onCompleted();
      setShowToast(true);
    });
  }

  const networkFee = useCancelDepositRequestFees({
    enabled: submitted !== null && (canCancel || cancelStep === "completed"),
    stakingVaultAddress,
  });

  const cancelDepositRequestMutation = useCancelDepositRequest({
    assets: amount,
    onEmitter: handleCancelDepositRequestEmitter,
    peggedToken,
    stakingVaultAddress,
  });

  const startCloseDrawer = useCallback(() => setRequestCloseDrawer(true), []);

  useCloseOnSuccess({
    onClose: startCloseDrawer,
    success: submitted !== null && cancelStep === "completed",
  });

  const cancel = function () {
    setCancelStep("idle");
    cancelDepositRequestMutation.mutate(undefined, { onError: handleFailed });
  };

  const handleCancel = function () {
    if (!data?.canCancel) {
      return;
    }
    setSubmitted({ assets: data.amount });
    cancel();
  };

  const handleCloseDrawer = function () {
    setRequestCloseDrawer(false);
    setSubmitted(null);
  };

  return (
    <>
      <Button
        disabled={!canCancel || cancelDepositRequestMutation.isPending}
        onClick={handleCancel}
        type="button"
        variant="secondary"
      >
        {t("pages.earn.fixed-term.cancel")}
      </Button>
      {submitted ? (
        <Drawer
          onClose={handleCloseDrawer}
          requestClose={requestCloseDrawer}
          title={t("pages.earn.fixed-term.cancel-deposit-in-progress")}
        >
          <Suspense fallback={<DrawerLoader />}>
            <CancelDepositProgressDrawer
              assets={submitted.assets}
              networkFee={networkFee}
              onRetry={
                cancelStep === "failed" && canCancel ? cancel : undefined
              }
              peggedToken={peggedToken}
              transactionStep={cancelStep}
            />
          </Suspense>
        </Drawer>
      ) : null}
      {showToast ? (
        <Toast
          description={t(
            "pages.earn.fixed-term.cancel-deposit-toast-description",
            {
              symbol: peggedToken.symbol,
            },
          )}
          onClose={() => setShowToast(false)}
          title={t("pages.earn.fixed-term.cancel-deposit-toast-title")}
        />
      ) : null}
    </>
  );
};
