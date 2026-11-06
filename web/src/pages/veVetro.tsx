import { PageTitle } from "components/base/pageTitle";
import { Spinner } from "components/base/spinner";
import { VeVetroPositionsTable } from "components/veVetro/veVetroPositionsTable";
import { useVeVetroClaimBlocker } from "hooks/useVeVetroClaimBlocker";
import { useVeVetroPositions } from "hooks/useVeVetroPositions";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";
import { useAccount } from "wagmi";

function getConnectedDecision({
  claimBlocker,
  isPositionsError,
  positions,
}: {
  claimBlocker: ReturnType<typeof useVeVetroClaimBlocker>;
  isPositionsError: boolean;
  positions: unknown[] | undefined;
}) {
  if (positions !== undefined && positions.length > 0) {
    return "list";
  }
  if (
    claimBlocker === "load-error" ||
    (positions === undefined && isPositionsError)
  ) {
    return "claim";
  }
  if (positions === undefined || claimBlocker === "loading") {
    return "loading";
  }
  return claimBlocker === undefined ? "claim" : "list";
}

function useLandingDecision() {
  const { address, status } = useAccount();
  const claimBlocker = useVeVetroClaimBlocker();
  const { data: positions, isError: isPositionsError } = useVeVetroPositions();

  if (status === "connecting" || status === "reconnecting") {
    return "loading";
  }
  if (!address) {
    return "list";
  }
  return getConnectedDecision({ claimBlocker, isPositionsError, positions });
}

export const VeVetro = function () {
  const decision = useLandingDecision();
  const { t } = useTranslation();

  if (decision === "claim") {
    return <Navigate replace to="claim" />;
  }

  if (decision === "loading") {
    return (
      <div className="flex h-100 items-center justify-center">
        <Spinner size="xLarge" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageTitle value={t("pages.ve-vetro.title")} />
      <div className="bg-gray-100">
        <VeVetroPositionsTable />
      </div>
    </div>
  );
};
