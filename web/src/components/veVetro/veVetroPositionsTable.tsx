import { ButtonLink } from "components/base/button";
import { DisplayAmount } from "components/base/displayAmount";
import { ExternalLink } from "components/base/externalLink";
import { SectionHeader } from "components/base/sectionHeader";
import { Table, type TableColumnDef } from "components/base/table";
import { Header } from "components/base/table/header";
import { ExternalLinkIcon } from "components/icons/externalLinkIcon";
import { TokenLogo } from "components/tokenLogo";
import type { fetchVeVetroPositions } from "fetchers/fetchVeVetroPositions";
import { useVeVetroClaimBlocker } from "hooks/useVeVetroClaimBlocker";
import { useVeVetroPositions } from "hooks/useVeVetroPositions";
import { veVetroChain } from "networks";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatMediumDate } from "utils/date";
import { isGeoRestricted } from "utils/geoRestriction";
import { veVetroContracts, veVetroToken, vToken } from "utils/veVetro";
import { useAccount } from "wagmi";

import { DisconnectedState, EmptyState, ErrorState } from "./tableStates";
import { VAmountContainer } from "./vAmountContainer";

type Position = Awaited<ReturnType<typeof fetchVeVetroPositions>>[number];

const explorerUrl = veVetroChain.blockExplorers.default.url;

export function VeVetroPositionsTable() {
  const { address } = useAccount();
  const claimBlocker = useVeVetroClaimBlocker();
  const { i18n, t } = useTranslation();
  const { data, isError, isLoading, refetch } = useVeVetroPositions();

  const columns = useMemo(
    (): TableColumnDef<Position>[] => [
      {
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {veVetroToken && <TokenLogo {...veVetroToken} />}
            <ExternalLink
              className="text-b-medium flex items-center gap-2 text-gray-900 [&:hover>svg]:text-gray-900 [&>svg]:text-gray-500 [&>svg]:transition-colors"
              href={`${explorerUrl}/token/${veVetroContracts.veVetro}/instance/${row.original.tokenId}`}
            >
              {t("pages.ve-vetro.positions.position-id", {
                id: row.original.tokenId.toString(),
              })}
              <ExternalLinkIcon />
            </ExternalLink>
          </div>
        ),
        header: () => (
          <Header text={t("pages.ve-vetro.positions.col-position")} />
        ),
        id: "position",
        meta: { width: "220px" },
      },
      {
        cell: ({ row }) => (
          <span className="text-b-medium text-gray-900">
            {t("pages.ve-vetro.positions.unlock-date", {
              date: formatMediumDate(
                row.original.unlockTime,
                i18n.language,
                "UTC",
              ),
            })}
          </span>
        ),
        header: () => (
          <Header text={t("pages.ve-vetro.positions.col-unlock-date")} />
        ),
        id: "unlock-date",
        meta: { className: "grow", width: "220px" },
      },
      {
        cell: ({ row }) => (
          <div className="text-b-medium flex items-center gap-2 text-gray-900">
            <TokenLogo {...vToken} />
            <DisplayAmount
              amount={row.original.amount}
              container={VAmountContainer}
              showSymbol={false}
              token={vToken}
            />
          </div>
        ),
        header: () => <Header text={`$${vToken.symbol}`} />,
        id: "amount",
        meta: { className: "justify-end", width: "160px" },
      },
    ],
    [i18n.language, t],
  );

  function getPlaceholder() {
    if (!address) {
      return (
        <DisconnectedState
          description={t("pages.ve-vetro.positions.disconnected-description")}
          title={t("pages.ve-vetro.positions.disconnected-title")}
        />
      );
    }
    if (isError) {
      return (
        <ErrorState
          description={t("pages.ve-vetro.positions.error-description")}
          onRetry={() => refetch()}
          title={t("pages.ve-vetro.positions.error-title")}
        />
      );
    }
    return (
      <EmptyState
        description={t("pages.ve-vetro.positions.empty-description")}
        title={t("pages.ve-vetro.positions.empty-title")}
      />
    );
  }

  return (
    <div>
      <SectionHeader title={t("pages.ve-vetro.positions.title")}>
        {address && claimBlocker === undefined && !isGeoRestricted() && (
          <ButtonLink href="/vevetro/claim" size="small" variant="primary">
            {t("pages.ve-vetro.positions.claim-button", {
              symbol: vToken.symbol,
            })}
          </ButtonLink>
        )}
      </SectionHeader>
      <Table
        columns={columns}
        data={data ?? []}
        getRowId={(position) => position.tokenId.toString()}
        loading={isLoading}
        placeholder={getPlaceholder()}
        skeletonRowCount={3}
      />
    </div>
  );
}
