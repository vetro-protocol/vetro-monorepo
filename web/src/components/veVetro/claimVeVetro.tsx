import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Toast } from "components/base/toast";
import { GeoRestrictedButton } from "components/geoRestrictedButton";
import { useClaimVeVetro } from "hooks/useClaimVeVetro";
import { useCloseOnSuccess } from "hooks/useCloseOnSuccess";
import { useVeVetroClaimableAmount } from "hooks/useVeVetroClaimableAmount";
import { useVeVetroClaimablePositionCount } from "hooks/useVeVetroClaimablePositionCount";
import { useVeVetroHasClaimEnded } from "hooks/useVeVetroHasClaimEnded";
import { useVeVetroIsClaimOpen } from "hooks/useVeVetroIsClaimOpen";
import { lazy, Suspense, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { getClaimBlocker, minClaimAmount, vToken } from "utils/veVetro";
import { formatUnits } from "viem";

import type { Submitted } from "./claimVeVetroDrawer";

const ClaimVeVetroDrawer = lazy(() =>
  import("./claimVeVetroDrawer").then((m) => ({
    default: m.ClaimVeVetroDrawer,
  })),
);

export function ClaimVeVetro() {
  const { t } = useTranslation();
  const { data: amount, isError: isAmountError } = useVeVetroClaimableAmount();
  const { data: hasClaimEnded, isError: isClaimEndError } =
    useVeVetroHasClaimEnded();
  const { data: isClaimOpen, isError: isClaimOpenError } =
    useVeVetroIsClaimOpen();
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

  const claimBlocker = getClaimBlocker({
    amount,
    hasClaimEnded,
    isAmountError,
    isClaimEndError,
    isClaimOpen,
    isClaimOpenError,
  });

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
      <GeoRestrictedButton
        disabled={!claimVeVetro.isPending && claimBlocker !== undefined}
        onClick={handleOpenDrawer}
        size="small"
        tooltip={
          claimVeVetro.isPending || claimBlocker === undefined
            ? undefined
            : tooltips[claimBlocker]
        }
        type="button"
      >
        {claimVeVetro.isPending
          ? t("pages.ve-vetro.claim.view-progress")
          : t("pages.ve-vetro.claim.claim-button")}
      </GeoRestrictedButton>
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
