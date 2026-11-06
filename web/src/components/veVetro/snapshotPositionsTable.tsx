import { DisplayAmount } from "components/base/displayAmount";
import { ExternalLink } from "components/base/externalLink";
import { SectionHeader } from "components/base/sectionHeader";
import { StatusBadge } from "components/base/statusBadge";
import { Table, type TableColumnDef } from "components/base/table";
import { Header } from "components/base/table/header";
import { ExternalLinkIcon } from "components/icons/externalLinkIcon";
import { TokenLogo } from "components/tokenLogo";
import type { fetchVeVetroSnapshotPositions } from "fetchers/fetchVeVetroSnapshotPositions";
import { useVeVetroHasClaimEnded } from "hooks/useVeVetroHasClaimEnded";
import { useVeVetroSnapshotPositions } from "hooks/useVeVetroSnapshotPositions";
import { useVeVetroSnapshotTimestamp } from "hooks/useVeVetroSnapshotTimestamp";
import { veVetroChain } from "networks";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { formatMediumDate } from "utils/date";
import { hemiToken, veVetroContracts, vToken } from "utils/veVetro";
import { useAccount } from "wagmi";

import { ClaimVeVetro } from "./claimVeVetro";
import { DisconnectedState, EmptyState, ErrorState } from "./tableStates";
import { VAmountContainer } from "./vAmountContainer";

type Position = Awaited<
  ReturnType<typeof fetchVeVetroSnapshotPositions>
>[number];

const explorerUrl = veVetroChain.blockExplorers.default.url;

function StatusCell({ claimed, weight }: Position) {
  const { t } = useTranslation();
  const { data: hasClaimEnded, isError: isClaimEndError } =
    useVeVetroHasClaimEnded();

  if (weight === 0n) {
    return (
      <span className="text-xsm text-gray-500">
        {t("pages.ve-vetro.claim.positions.status-expired")}
      </span>
    );
  }
  if (claimed) {
    return (
      <StatusBadge variant="withdrawn">
        {t("pages.ve-vetro.claim.positions.status-claimed")}
      </StatusBadge>
    );
  }
  if (hasClaimEnded === undefined) {
    return isClaimEndError ? (
      <span className="text-b-medium text-gray-500">—</span>
    ) : (
      <Skeleton width={80} />
    );
  }
  if (hasClaimEnded) {
    return (
      <span className="text-xsm text-gray-500">
        {t("pages.ve-vetro.claim.positions.status-claim-ended")}
      </span>
    );
  }
  return (
    <StatusBadge variant="ready">
      {t("pages.ve-vetro.claim.positions.status-eligible")}
    </StatusBadge>
  );
}

function SnapshotCaption() {
  const { i18n, t } = useTranslation();
  const { data: snapshotTimestamp, isLoading } = useVeVetroSnapshotTimestamp();

  if (isLoading) {
    return <Skeleton width={240} />;
  }
  if (snapshotTimestamp === undefined) {
    return null;
  }
  const { snapshotBlock } = veVetroContracts;
  const date = formatMediumDate(
    Number(snapshotTimestamp),
    i18n.language,
    "UTC",
  );
  return (
    <span className="text-caption text-gray-500">
      {snapshotBlock === undefined
        ? t("pages.ve-vetro.claim.positions.snapshot-date", { date })
        : t("pages.ve-vetro.claim.positions.snapshot", {
            block: snapshotBlock.toLocaleString(i18n.language),
            date,
          })}
    </span>
  );
}

export function SnapshotPositionsTable() {
  const { address } = useAccount();
  const { t } = useTranslation();
  const { data, isError, isLoading, refetch } = useVeVetroSnapshotPositions();

  const columns = useMemo(
    (): TableColumnDef<Position>[] => [
      {
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <TokenLogo {...hemiToken} />
            <ExternalLink
              className="text-b-medium flex items-center gap-2 text-gray-900 [&:hover>svg]:text-gray-900 [&>svg]:text-gray-500 [&>svg]:transition-colors"
              href={`${explorerUrl}/token/${veVetroContracts.veHemi}/instance/${row.original.tokenId}`}
            >
              {t("pages.ve-vetro.claim.positions.position-id", {
                id: row.original.tokenId.toString(),
              })}
              <ExternalLinkIcon />
            </ExternalLink>
          </div>
        ),
        header: () => (
          <Header text={t("pages.ve-vetro.claim.positions.col-position")} />
        ),
        id: "position",
        meta: { width: "220px" },
      },
      {
        cell: ({ row }) => <StatusCell {...row.original} />,
        header: () => (
          <Header text={t("pages.ve-vetro.claim.positions.col-status")} />
        ),
        id: "status",
        meta: { className: "grow", width: "220px" },
      },
      {
        cell: ({ row }) =>
          row.original.weight === 0n ? (
            <span className="text-b-medium text-gray-500">—</span>
          ) : (
            <div className="text-b-medium flex items-center gap-2 text-gray-900">
              <TokenLogo {...vToken} />
              <DisplayAmount
                amount={row.original.share}
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
    [t],
  );

  function getPlaceholder() {
    if (!address) {
      return (
        <DisconnectedState
          description={t(
            "pages.ve-vetro.claim.positions.disconnected-description",
          )}
          title={t("pages.ve-vetro.claim.positions.disconnected-title")}
        />
      );
    }
    if (isError) {
      return (
        <ErrorState
          description={t("pages.ve-vetro.claim.positions.error-description")}
          onRetry={() => refetch()}
          title={t("pages.ve-vetro.claim.positions.error-title")}
        />
      );
    }
    return (
      <EmptyState
        description={t("pages.ve-vetro.claim.positions.empty-description")}
        title={t("pages.ve-vetro.claim.positions.empty-title")}
      />
    );
  }

  return (
    <div>
      <SectionHeader title={t("pages.ve-vetro.claim.positions.title")}>
        <div className="flex flex-wrap items-center gap-4">
          <SnapshotCaption />
          {address && <ClaimVeVetro key={address} />}
        </div>
      </SectionHeader>
      <Table
        columns={columns}
        data={data ?? []}
        getRowId={(position) => position.tokenId.toString()}
        loading={isLoading}
        placeholder={getPlaceholder()}
        skeletonRowCount={3}
      />
      {data !== undefined && data.length > 0 && (
        <p className="text-caption px-4 py-3 text-gray-500 md:px-16">
          {t("pages.ve-vetro.claim.positions.footnote")}
        </p>
      )}
    </div>
  );
}
