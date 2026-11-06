import { minClaimAmount } from "@vetro-protocol/ve-vetro";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { I18nLink } from "components/base/i18nLink";
import { Toast } from "components/base/toast";
import { GeoRestrictedButton } from "components/geoRestrictedButton";
import { useClaimVeVetro } from "hooks/useClaimVeVetro";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { useVeVetroClaimableAmount } from "hooks/useVeVetroClaimableAmount";
import { useVeVetroClaimablePositionCount } from "hooks/useVeVetroClaimablePositionCount";
import { useVeVetroClaimBlocker } from "hooks/useVeVetroClaimBlocker";
import { lazy, Suspense, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { vToken } from "utils/veVetro";
import { formatUnits } from "viem";

import type { Submitted } from "./claimVeVetroDrawer";

const ClaimVeVetroDrawer = lazy(() =>
  import("./claimVeVetroDrawer").then((m) => ({
    default: m.ClaimVeVetroDrawer,
  })),
);

const toastAutoCloseMs = 15_000;

type ClaimButtonProps = {
  claimBlocker: ReturnType<typeof useVeVetroClaimBlocker>;
  isPending: boolean;
  onClick: VoidFunction;
};

function ClaimButton({ claimBlocker, isPending, onClick }: ClaimButtonProps) {
  const { t } = useTranslation();

  const tooltips = {
    "below-minimum": t("pages.ve-vetro.claim.claim-button-below-minimum", {
      amount: formatUnits(minClaimAmount, vToken.decimals),
      symbol: vToken.symbol,
    }),
    "load-error": t("pages.ve-vetro.claim.claim-button-load-error"),
    loading: undefined,
    "not-open": t("pages.ve-vetro.claim.claim-button-not-open"),
    "nothing-to-claim": t("pages.ve-vetro.claim.claim-button-nothing-to-claim"),
  };

  return (
    <GeoRestrictedButton
      disabled={!isPending && claimBlocker !== undefined}
      onClick={onClick}
      size="small"
      tooltip={
        isPending || claimBlocker === undefined
          ? undefined
          : tooltips[claimBlocker]
      }
      type="button"
    >
      {isPending
        ? t("pages.ve-vetro.claim.view-progress")
        : t("pages.ve-vetro.claim.claim-button")}
    </GeoRestrictedButton>
  );
}

export function ClaimVeVetro() {
  const { t } = useTranslation();
  const { data: amount } = useVeVetroClaimableAmount();
  const claimBlocker = useVeVetroClaimBlocker();
  const { data: positionCount } = useVeVetroClaimablePositionCount();
  const [claimStarted, setClaimStarted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [requestCloseDrawer, setRequestCloseDrawer] = useState(false);
  const [restrictionAccepted, setRestrictionAccepted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted>();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const claimVeVetro = useClaimVeVetro({
    onClaimStart: () => setClaimStarted(true),
  });

  const startCloseDrawer = useCallback(() => setRequestCloseDrawer(true), []);

  useCloseOnSuccess({
    onClose: startCloseDrawer,
    success: isDrawerOpen && claimVeVetro.isSuccess,
  });

  function claim() {
    if (amount === undefined || positionCount === undefined) {
      return;
    }
    setClaimStarted(false);
    setSubmitted({ amount, positionCount });
    claimVeVetro.mutate(undefined, {
      onSuccess: () => setShowToast(true),
    });
  }

  function resetClaim() {
    claimVeVetro.reset();
    setClaimStarted(false);
    setRestrictionAccepted(false);
    setSubmitted(undefined);
    setTermsAccepted(false);
  }

  function handleOpenDrawer() {
    if (!claimVeVetro.isPending) {
      resetClaim();
    }
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
    setRequestCloseDrawer(false);
  }

  return (
    <>
      {(claimVeVetro.isPending || claimBlocker !== "nothing-to-claim") && (
        <ClaimButton
          claimBlocker={claimBlocker}
          isPending={claimVeVetro.isPending}
          onClick={handleOpenDrawer}
        />
      )}
      {isDrawerOpen && (
        <Drawer
          onClose={handleCloseDrawer}
          requestClose={requestCloseDrawer}
          title={
            claimVeVetro.isSuccess
              ? t("pages.ve-vetro.claim.drawer.claim-complete-title")
              : t("pages.ve-vetro.claim.drawer.title", {
                  symbol: vToken.symbol,
                })
          }
        >
          <Suspense fallback={<DrawerLoader />}>
            <ClaimVeVetroDrawer
              claimStarted={claimStarted}
              onClaim={claim}
              onRestrictionChange={setRestrictionAccepted}
              onRetry={claimVeVetro.isError ? claim : undefined}
              onTermsChange={setTermsAccepted}
              restrictionAccepted={restrictionAccepted}
              status={claimVeVetro.status}
              submitted={submitted}
              termsAccepted={termsAccepted}
            />
          </Suspense>
        </Drawer>
      )}
      {showToast && (
        <Toast
          action={
            <I18nLink
              className="text-sm leading-5 font-medium text-blue-400 hover:text-blue-300"
              to="/vevetro"
            >
              {t("pages.ve-vetro.claim.toast-see-positions")}
            </I18nLink>
          }
          autoCloseMs={toastAutoCloseMs}
          description={t("pages.ve-vetro.claim.toast-description", {
            symbol: vToken.symbol,
          })}
          onClose={() => setShowToast(false)}
          title={t("pages.ve-vetro.claim.toast-title")}
        />
      )}
    </>
  );
}
