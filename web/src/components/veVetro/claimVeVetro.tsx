import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { GeoRestrictedButton } from "components/geoRestrictedButton";
import { useVeVetroClaimableAmount } from "hooks/useVeVetroClaimableAmount";
import { useVeVetroHasClaimEnded } from "hooks/useVeVetroHasClaimEnded";
import { useVeVetroIsClaimOpen } from "hooks/useVeVetroIsClaimOpen";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { getClaimBlocker, minClaimAmount, vToken } from "utils/veVetro";
import { formatUnits } from "viem";

const ClaimVeVetroDrawer = lazy(() =>
  import("./claimVeVetroDrawer").then((m) => ({
    default: m.ClaimVeVetroDrawer,
  })),
);

export function ClaimVeVetro() {
  const { t } = useTranslation();
  const { data: amount } = useVeVetroClaimableAmount();
  const { data: hasClaimEnded, isError: isClaimEndError } =
    useVeVetroHasClaimEnded();
  const { data: isClaimOpen } = useVeVetroIsClaimOpen();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const claimBlocker = getClaimBlocker({
    amount,
    hasClaimEnded,
    isClaimEndError,
    isClaimOpen,
  });

  const tooltips = {
    "below-minimum": t("pages.ve-vetro.claim.claim-button-below-minimum", {
      amount: formatUnits(minClaimAmount, vToken.decimals),
      symbol: vToken.symbol,
    }),
    "claim-end-error": t("pages.ve-vetro.claim.claim-button-claim-end-error"),
    loading: undefined,
    "not-open": t("pages.ve-vetro.claim.claim-button-not-open"),
    "nothing-to-claim": t("pages.ve-vetro.claim.claim-button-nothing-to-claim"),
  };

  return (
    <>
      <GeoRestrictedButton
        disabled={claimBlocker !== undefined}
        onClick={() => setIsDrawerOpen(true)}
        size="small"
        tooltip={
          claimBlocker === undefined ? undefined : tooltips[claimBlocker]
        }
        type="button"
      >
        {t("pages.ve-vetro.claim.claim-button")}
      </GeoRestrictedButton>
      {isDrawerOpen && (
        <Drawer
          onClose={() => setIsDrawerOpen(false)}
          title={t("pages.ve-vetro.claim.drawer.title", {
            symbol: vToken.symbol,
          })}
        >
          <Suspense fallback={<DrawerLoader />}>
            <ClaimVeVetroDrawer />
          </Suspense>
        </Drawer>
      )}
    </>
  );
}
