import type { MutationStatus } from "@tanstack/react-query";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { DrawerRetryFooter } from "components/base/drawer/drawerRetryFooter";
import {
  TokenInteraction,
  TokenInteractionList,
} from "components/base/tokenInteraction";
import {
  type Step,
  stepStatus,
  VerticalStepper,
} from "components/base/verticalStepper";
import { FeeDetails } from "components/feeDetails";
import { DrawerFeesContainer } from "components/feesContainer";
import { GeoRestrictedButton } from "components/geoRestrictedButton";
import { NetworkFees } from "components/networkFees";
import { useClaimVeVetroFees } from "hooks/useClaimVeVetroFees";
import { useVeVetroClaimableAmount } from "hooks/useVeVetroClaimableAmount";
import { useVeVetroClaimablePositionCount } from "hooks/useVeVetroClaimablePositionCount";
import { useVeVetroRequireTermsSignature } from "hooks/useVeVetroRequireTermsSignature";
import { useVeVetroUnlockTimestamp } from "hooks/useVeVetroUnlockTimestamp";
import { useTranslation } from "react-i18next";
import { formatMediumDate } from "utils/date";
import { vToken } from "utils/veVetro";

import { ClaimAgreement } from "./claimAgreement";

const timeZone = "UTC";

export type Submitted = { amount: bigint; positionCount: number };

function ClaimAmount({ submitted }: { submitted: Submitted | undefined }) {
  const { t } = useTranslation();
  const { data: amount, status } = useVeVetroClaimableAmount();

  return (
    <TokenInteraction
      amount={
        submitted ? (
          <RenderCryptoValue token={vToken} value={submitted.amount} />
        ) : (
          <RenderCryptoValue status={status} token={vToken} value={amount} />
        )
      }
      detail={t("pages.ve-vetro.claim.drawer.as-position")}
      label={t("pages.ve-vetro.claim.drawer.you-will-claim")}
      token={{ logoURI: vToken.logoURI, symbol: `$${vToken.symbol}` }}
    />
  );
}

function ClaimDetails({ submitted }: { submitted: Submitted | undefined }) {
  const { i18n, t } = useTranslation();
  const { data: currentPositionCount, isError: isPositionCountError } =
    useVeVetroClaimablePositionCount();
  const positionCount = submitted?.positionCount ?? currentPositionCount;
  const unlockTimestamp = useVeVetroUnlockTimestamp();
  const networkFee = useClaimVeVetroFees();

  return (
    <DrawerFeesContainer>
      <FeeDetails
        className="first:border-t-0"
        isError={submitted === undefined && isPositionCountError}
        label={t("pages.ve-vetro.claim.drawer.from")}
        value={
          positionCount === undefined
            ? undefined
            : t("pages.ve-vetro.claim.drawer.from-positions", {
                count: positionCount,
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

const signStepStatuses: Record<MutationStatus, Step["status"]> = {
  error: stepStatus.failed,
  idle: stepStatus.ready,
  pending: stepStatus.progress,
  success: stepStatus.completed,
};

const claimStepStatuses: Record<MutationStatus, Step["status"]> = {
  ...signStepStatuses,
  idle: stepStatus.notReady,
};

const signStepDescriptions = {
  error: "pages.ve-vetro.claim.drawer.sign-step-failed",
  idle: "pages.ve-vetro.claim.drawer.sign-step-description",
  pending: "pages.ve-vetro.claim.drawer.sign-step-progress",
  success: "pages.ve-vetro.claim.drawer.sign-step-completed",
} as const satisfies Record<MutationStatus, string>;

const claimStepDescriptions = {
  error: "pages.ve-vetro.claim.drawer.claim-step-failed",
  idle: "pages.ve-vetro.claim.drawer.claim-step-description",
  pending: "pages.ve-vetro.claim.drawer.claim-step-progress",
  success: "pages.ve-vetro.claim.drawer.claim-step-completed",
} as const satisfies Record<MutationStatus, string>;

type ClaimProgressProps = {
  claimStatus: MutationStatus;
  requireTermsSignature: boolean;
  signStatus: MutationStatus;
};

function ClaimProgress({
  claimStatus,
  requireTermsSignature,
  signStatus,
}: ClaimProgressProps) {
  const { t } = useTranslation();

  const signStep: Step = {
    description: t(signStepDescriptions[signStatus]),
    status: signStepStatuses[signStatus],
    title: t("pages.ve-vetro.claim.drawer.sign-terms"),
  };

  const claimStep: Step = {
    description: t(claimStepDescriptions[claimStatus], {
      symbol: vToken.symbol,
    }),
    status: claimStepStatuses[claimStatus],
    title: t("pages.ve-vetro.claim.drawer.claim-step-title", {
      symbol: vToken.symbol,
    }),
  };

  return (
    <div className="flex flex-col gap-2 px-6 pb-6">
      <p className="text-caption text-gray-500">
        {t("pages.ve-vetro.claim.drawer.progress")}
      </p>
      <div className="border-t border-gray-200">
        <VerticalStepper
          steps={requireTermsSignature ? [signStep, claimStep] : [claimStep]}
        />
      </div>
    </div>
  );
}

type ClaimVeVetroDrawerProps = {
  claimStarted: boolean;
  onClaim: VoidFunction;
  onRestrictionChange: (checked: boolean) => void;
  onRetry: VoidFunction | undefined;
  onTermsChange: (checked: boolean) => void;
  restrictionAccepted: boolean;
  status: MutationStatus;
  submitted: Submitted | undefined;
  termsAccepted: boolean;
};

export function ClaimVeVetroDrawer({
  claimStarted,
  onClaim,
  onRestrictionChange,
  onRetry,
  onTermsChange,
  restrictionAccepted,
  status,
  submitted,
  termsAccepted,
}: ClaimVeVetroDrawerProps) {
  const { t } = useTranslation();
  const { data: requireTermsSignature = true } =
    useVeVetroRequireTermsSignature();
  const claimStatus = claimStarted ? status : "idle";
  const signStatus = claimStarted ? "success" : status;

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <TokenInteractionList>
          <ClaimAmount submitted={submitted} />
        </TokenInteractionList>
        <ClaimDetails submitted={submitted} />
        {signStatus !== "success" && (
          <ClaimAgreement
            disabled={signStatus !== "idle"}
            onRestrictionChange={onRestrictionChange}
            onTermsChange={onTermsChange}
            restrictionAccepted={restrictionAccepted}
            termsAccepted={termsAccepted}
          />
        )}
        <div className="min-h-4 flex-1" />
        <ClaimProgress
          claimStatus={claimStatus}
          requireTermsSignature={requireTermsSignature}
          signStatus={signStatus}
        />
      </div>
      {signStatus === "idle" && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 *:w-full [&_button]:w-full">
          <GeoRestrictedButton
            disabled={!restrictionAccepted || !termsAccepted}
            onClick={onClaim}
            size="small"
            type="button"
            variant="primary"
          >
            {requireTermsSignature
              ? t("pages.ve-vetro.claim.drawer.sign-terms")
              : t("pages.ve-vetro.claim.claim-button")}
          </GeoRestrictedButton>
        </div>
      )}
      <DrawerRetryFooter onRetry={onRetry} />
    </div>
  );
}
