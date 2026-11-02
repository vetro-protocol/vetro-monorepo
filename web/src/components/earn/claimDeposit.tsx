import type { Token } from "@vetro-protocol/core";
import { Button } from "components/base/button";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Toast } from "components/base/toast";
import type { TransactionStep } from "components/earn/transactionProgressDrawer";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import {
  type ClaimDepositEmitter,
  useClaimDeposit,
} from "pages/earn/hooks/targetYieldPool/useClaimDeposit";
import { useClaimDepositFees } from "pages/earn/hooks/targetYieldPool/useClaimDepositFees";
import { useDepositRequest } from "pages/earn/hooks/targetYieldPool/useDepositRequest";
import { Suspense, lazy, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount } from "utils/token";
import type { Address } from "viem";

const ClaimDepositProgressDrawer = lazy(() =>
  import("components/earn/claimDepositProgressDrawer").then((m) => ({
    default: m.ClaimDepositProgressDrawer,
  })),
);

type Props = {
  peggedToken: Token;
  shareToken: Token;
  stakingVaultAddress: Address;
};

export const ClaimDeposit = function ({
  peggedToken,
  shareToken,
  stakingVaultAddress,
}: Props) {
  const { t } = useTranslation();
  const { data } = useDepositRequest(stakingVaultAddress);
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
      text: t("pages.earn.activity.claim-deposit-text", {
        amount: formatAmount({
          amount: data?.shares ?? 0n,
          decimals: shareToken.decimals,
          isError: false,
        }),
        symbol: shareToken.symbol,
      }),
      title: `${t("nav.earn")} · ${t("pages.earn.fixed-term.claim-shares", {
        symbol: shareToken.symbol,
      })}`,
    });

  function handleFailed() {
    setClaimStep("failed");
    onFailed();
  }

  function handleClaimDepositEmitter(emitter: ClaimDepositEmitter) {
    emitter.on("user-signed-claim-deposit", function (hash) {
      onTransactionHash(hash);
      setClaimStep("progress");
      onPending();
    });
    emitter.on("user-signing-claim-deposit-error", handleFailed);
    emitter.on("claim-deposit-failed", handleFailed);
    emitter.on("claim-deposit-failed-validation", handleFailed);
    emitter.on("unexpected-error", handleFailed);
    emitter.on("claim-deposit-transaction-reverted", handleFailed);
    emitter.on("claim-deposit-transaction-succeeded", function () {
      setClaimStep("completed");
      onCompleted();
      setShowToast(true);
    });
  }

  const networkFee = useClaimDepositFees({
    assets: submitted?.assets ?? 0n,
    enabled: canClaim || claimStep === "completed",
    stakingVaultAddress,
  });

  const claimDepositMutation = useClaimDeposit({
    chainId: peggedToken.chainId,
    onEmitter: handleClaimDepositEmitter,
    stakingVaultAddress,
  });

  const startCloseDrawer = useCallback(() => setRequestCloseDrawer(true), []);

  useCloseOnSuccess({
    onClose: startCloseDrawer,
    success: submitted !== null && claimStep === "completed",
  });

  const claim = function () {
    setClaimStep("idle");
    claimDepositMutation.mutate(undefined, { onError: handleFailed });
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
        disabled={!canClaim || claimDepositMutation.isPending}
        onClick={handleClaim}
        type="button"
      >
        {t("pages.earn.fixed-term.claim-shares", {
          symbol: shareToken.symbol,
        })}
      </Button>
      {submitted ? (
        <Drawer
          onClose={handleCloseDrawer}
          requestClose={requestCloseDrawer}
          title={t("pages.earn.fixed-term.claim-deposit-in-progress")}
        >
          <Suspense fallback={<DrawerLoader />}>
            <ClaimDepositProgressDrawer
              assets={submitted.assets}
              networkFee={networkFee}
              onRetry={claimStep === "failed" && canClaim ? claim : undefined}
              peggedToken={peggedToken}
              shares={submitted.shares}
              shareToken={shareToken}
              transactionStep={claimStep}
            />
          </Suspense>
        </Drawer>
      ) : null}
      {showToast ? (
        <Toast
          description={t(
            "pages.earn.fixed-term.claim-deposit-toast-description",
            {
              symbol: shareToken.symbol,
            },
          )}
          onClose={() => setShowToast(false)}
          title={t("pages.earn.fixed-term.claim-deposit-toast-title")}
        />
      ) : null}
    </>
  );
};
