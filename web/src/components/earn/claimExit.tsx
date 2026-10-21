import type { Token } from "@vetro-protocol/core";
import { Button } from "components/base/button";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Toast } from "components/base/toast";
import type { TransactionStep } from "components/earn/transactionProgressDrawer";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import {
  type ClaimExitEmitter,
  useClaimExit,
} from "pages/earn/hooks/targetYieldPool/useClaimExit";
import { useClaimExitFees } from "pages/earn/hooks/targetYieldPool/useClaimExitFees";
import { useRedeemRequest } from "pages/earn/hooks/targetYieldPool/useRedeemRequest";
import { Suspense, lazy, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount } from "utils/token";
import type { Address } from "viem";

const ClaimExitProgressDrawer = lazy(() =>
  import("components/earn/claimExitProgressDrawer").then((m) => ({
    default: m.ClaimExitProgressDrawer,
  })),
);

type Props = {
  peggedToken: Token;
  stakingVaultAddress: Address;
};

export const ClaimExit = function ({
  peggedToken,
  stakingVaultAddress,
}: Props) {
  const { t } = useTranslation();
  const { data } = useRedeemRequest(stakingVaultAddress);
  const canClaim = !!data?.canClaim;
  const [claimStep, setClaimStep] = useState<TransactionStep>("idle");
  const [requestCloseDrawer, setRequestCloseDrawer] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [submitted, setSubmitted] = useState<{
    assets: bigint;
    shares: bigint;
  } | null>(null);

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.claim-exit-text", {
        amount: formatAmount({
          amount: data?.amount ?? 0n,
          decimals: peggedToken.decimals,
          isError: false,
        }),
        symbol: peggedToken.symbol,
      }),
      title: `${t("nav.earn")} · ${t("pages.earn.fixed-term.claim-shares", {
        symbol: peggedToken.symbol,
      })}`,
    });

  function handleFailed() {
    setClaimStep("failed");
    onFailed();
  }

  function handleClaimExitEmitter(emitter: ClaimExitEmitter) {
    emitter.on("user-signed-claim-redeem", function (hash) {
      onTransactionHash(hash);
      setClaimStep("progress");
      onPending();
    });
    emitter.on("user-signing-claim-redeem-error", handleFailed);
    emitter.on("claim-redeem-failed", handleFailed);
    emitter.on("claim-redeem-failed-validation", handleFailed);
    emitter.on("unexpected-error", handleFailed);
    emitter.on("claim-redeem-transaction-reverted", handleFailed);
    emitter.on("claim-redeem-transaction-succeeded", function () {
      setClaimStep("completed");
      onCompleted();
      setShowToast(true);
    });
  }

  const networkFee = useClaimExitFees({
    enabled: canClaim || claimStep === "completed",
    shares: submitted?.shares ?? 0n,
    stakingVaultAddress,
  });

  const claimExitMutation = useClaimExit({
    onEmitter: handleClaimExitEmitter,
    peggedToken,
    stakingVaultAddress,
  });

  const startCloseDrawer = useCallback(() => setRequestCloseDrawer(true), []);

  useCloseOnSuccess({
    onClose: startCloseDrawer,
    success: submitted !== null && claimStep === "completed",
  });

  const claim = function () {
    setClaimStep("idle");
    claimExitMutation.mutate(undefined, { onError: handleFailed });
  };

  const handleClaim = function () {
    if (!data?.canClaim) {
      return;
    }
    setSubmitted({ assets: data.amount, shares: data.shares });
    claim();
  };

  const handleCloseDrawer = function () {
    setRequestCloseDrawer(false);
    setSubmitted(null);
  };

  return (
    <>
      <Button
        disabled={!canClaim || claimExitMutation.isPending}
        onClick={handleClaim}
        type="button"
      >
        {t("pages.earn.fixed-term.claim-shares", {
          symbol: peggedToken.symbol,
        })}
      </Button>
      {submitted ? (
        <Drawer onClose={handleCloseDrawer} requestClose={requestCloseDrawer}>
          <Suspense fallback={<DrawerLoader />}>
            <ClaimExitProgressDrawer
              assets={submitted.assets}
              networkFee={networkFee}
              onRetry={claimStep === "failed" && canClaim ? claim : undefined}
              peggedToken={peggedToken}
              transactionStep={claimStep}
            />
          </Suspense>
        </Drawer>
      ) : null}
      {showToast ? (
        <Toast
          autoCloseMs={5000}
          closable={true}
          description={t("pages.earn.fixed-term.claim-exit-toast-description", {
            symbol: peggedToken.symbol,
          })}
          onClose={() => setShowToast(false)}
          title={t("pages.earn.fixed-term.claim-exit-toast-title")}
        />
      ) : null}
    </>
  );
};
