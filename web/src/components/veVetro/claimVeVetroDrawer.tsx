import { RenderCryptoValue } from "components/base/cryptoValue";
import {
  TokenInteraction,
  TokenInteractionList,
} from "components/base/tokenInteraction";
import { stepStatus, VerticalStepper } from "components/base/verticalStepper";
import { FeeDetails } from "components/feeDetails";
import { DrawerFeesContainer } from "components/feesContainer";
import { GeoRestrictedButton } from "components/geoRestrictedButton";
import { NetworkFees } from "components/networkFees";
import { useClaimVeVetroFees } from "hooks/useClaimVeVetroFees";
import { useVeVetroClaimableAmount } from "hooks/useVeVetroClaimableAmount";
import { useVeVetroClaimablePositionCount } from "hooks/useVeVetroClaimablePositionCount";
import { useVeVetroUnlockTimestamp } from "hooks/useVeVetroUnlockTimestamp";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMediumDate } from "utils/date";
import { vToken } from "utils/veVetro";

import { ClaimAgreement } from "./claimAgreement";

const timeZone = "UTC";

function ClaimAmount() {
  const { t } = useTranslation();
  const { data: amount, status } = useVeVetroClaimableAmount();

  return (
    <TokenInteraction
      amount={
        <RenderCryptoValue status={status} token={vToken} value={amount} />
      }
      detail={t("pages.ve-vetro.claim.drawer.as-position")}
      label={t("pages.ve-vetro.claim.drawer.you-will-claim")}
      token={{ logoURI: vToken.logoURI, symbol: `$${vToken.symbol}` }}
    />
  );
}

function ClaimDetails() {
  const { i18n, t } = useTranslation();
  const positionCount = useVeVetroClaimablePositionCount();
  const unlockTimestamp = useVeVetroUnlockTimestamp();
  const networkFee = useClaimVeVetroFees();

  return (
    <DrawerFeesContainer>
      <FeeDetails
        className="first:border-t-0"
        isError={positionCount.isError}
        label={t("pages.ve-vetro.claim.drawer.from")}
        value={
          positionCount.data === undefined
            ? undefined
            : t("pages.ve-vetro.claim.drawer.from-positions", {
                count: positionCount.data,
              })
        }
      />
      <FeeDetails
        isError={unlockTimestamp.isError}
        label={t("pages.ve-vetro.claim.drawer.unlocks-on")}
        value={
          unlockTimestamp.data === undefined
            ? undefined
            : formatMediumDate(
                Number(unlockTimestamp.data),
                i18n.language,
                timeZone,
              )
        }
      />
      <NetworkFees
        networkFee={networkFee}
        sectionClassName="border-t border-gray-200"
      />
    </DrawerFeesContainer>
  );
}

function ClaimProgress() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 px-6 pb-6">
      <p className="text-caption text-gray-500">
        {t("pages.ve-vetro.claim.drawer.progress")}
      </p>
      <div className="border-t border-gray-200">
        <VerticalStepper
          steps={[
            {
              status: stepStatus.ready,
              title: t("pages.ve-vetro.claim.drawer.sign-terms"),
            },
            {
              description: t(
                "pages.ve-vetro.claim.drawer.claim-step-description",
              ),
              status: stepStatus.notReady,
              title: t("pages.ve-vetro.claim.drawer.claim-step-title", {
                symbol: vToken.symbol,
              }),
            },
          ]}
        />
      </div>
    </div>
  );
}

export function ClaimVeVetroDrawer() {
  const { t } = useTranslation();
  const [restrictionAccepted, setRestrictionAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <TokenInteractionList>
          <ClaimAmount />
        </TokenInteractionList>
        <ClaimDetails />
        <ClaimAgreement
          onRestrictionChange={setRestrictionAccepted}
          onTermsChange={setTermsAccepted}
          restrictionAccepted={restrictionAccepted}
          termsAccepted={termsAccepted}
        />
        <div className="min-h-4 flex-1" />
        <ClaimProgress />
      </div>
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 *:w-full [&_button]:w-full">
        <GeoRestrictedButton
          disabled={!restrictionAccepted || !termsAccepted}
          size="small"
          type="button"
          variant="primary"
        >
          {t("pages.ve-vetro.claim.drawer.sign-terms")}
        </GeoRestrictedButton>
      </div>
    </div>
  );
}
