import { useConnectModal } from "@rainbow-me/rainbowkit";
import { type ColumnDef } from "@tanstack/react-table";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { Badge } from "components/base/badge";
import { Button } from "components/base/button";
import { FilterMenu } from "components/base/filterMenu";
import { StatusBadge } from "components/base/statusBadge";
import { Table } from "components/base/table";
import { Header } from "components/base/table/header";
import { TopSection } from "components/base/table/topSection";
import { Toast } from "components/base/toast";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useClaimWithdrawBatch } from "hooks/useClaimWithdrawBatch";
import { TableCellsIcon } from "pages/earn/icons/tableCellsIcon";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";

import { useExitTickets } from "../../hooks/useExitTickets";
import type { ExitTicket } from "../../types";

import { ActionsCell } from "./actionsCell";
import { CooldownCell } from "./cooldownCell";
import { DateCreatedCell } from "./dateCreatedCell";
import { EmptyState } from "./emptyState";
import { getTicketStatus } from "./getTicketStatus";
import { TxsCell } from "./txsCell";
import { WithdrawalCell } from "./withdrawalCell";

const statusLabels = {
  cooldown: "pages.earn.exit-tickets.cooldown-in-progress",
  ready: "pages.earn.exit-tickets.ready-to-withdraw",
  withdrawn: "pages.earn.exit-tickets.withdrawn",
} as const;

const getColumns = ({
  isWithdrawingAll,
  onDeleteSuccess,
  onWithdrawingChange,
  t,
}: {
  isWithdrawingAll: boolean;
  onDeleteSuccess: VoidFunction;
  onWithdrawingChange: (isWithdrawing: boolean) => void;
  t: ReturnType<typeof useTranslation>["t"];
}): ColumnDef<ExitTicket>[] => [
  {
    cell: ({ row }) => <DateCreatedCell ticket={row.original} />,
    header: () => (
      <Header text={t("pages.earn.exit-tickets.col-date-created")} />
    ),
    id: "date-created",
    meta: { width: "136px" },
  },
  {
    cell: ({ row }) => <CooldownCell ticket={row.original} />,
    header: () => (
      <Header text={t("pages.earn.exit-tickets.col-cooldown-left")} />
    ),
    id: "cooldown-left",
    meta: { width: "136px" },
  },
  {
    cell: ({ row }) => <WithdrawalCell ticket={row.original} />,
    header: () => <Header text={t("pages.earn.exit-tickets.col-withdrawal")} />,
    id: "withdrawal",
    meta: { width: "136px" },
  },
  {
    cell({ row }) {
      const status = getTicketStatus(row.original);
      if (status === "cancelled") {
        return null;
      }
      return (
        <StatusBadge variant={status}>{t(statusLabels[status])}</StatusBadge>
      );
    },
    header: () => <Header text={t("pages.earn.exit-tickets.col-status")} />,
    id: "status",
    meta: { width: "190px" },
  },
  {
    cell: ({ row }) => <TxsCell ticket={row.original} />,
    header: () => <Header text={t("pages.earn.exit-tickets.col-txs")} />,
    id: "txs",
    meta: { width: "132px" },
  },
  {
    cell: ({ row }) => (
      <ActionsCell
        disabled={isWithdrawingAll}
        key={row.original.requestId}
        onDeleteSuccess={onDeleteSuccess}
        onWithdrawingChange={onWithdrawingChange}
        ticket={row.original}
      />
    ),
    header: () => <Header text={t("pages.earn.exit-tickets.actions")} />,
    id: "actions",
    meta: { className: "justify-end", width: "150px" },
  },
];

// TODO we'll update this in the next PR to add support to
// exit tickets from multiple vaults - hardcoding to one for the time being
const stakingVaultAddress = stakingVaultAddresses[0];

export function ExitTickets() {
  const { data, isLoading } = useExitTickets();
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [selectedFilters, setSelectedFilters] = useState([
    "completed",
    "pending",
  ]);
  const [isWithdrawingAll, setIsWithdrawingAll] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [showWithdrawAllToast, setShowWithdrawAllToast] = useState(false);
  const [withdrawingSingleCount, setWithdrawingSingleCount] = useState(0);

  const readyTickets = useMemo(
    () => (data ?? []).filter((ticket) => getTicketStatus(ticket) === "ready"),
    [data],
  );

  const readyRequestIds = useMemo(
    () => readyTickets.map((ticket) => BigInt(ticket.requestId)),
    [readyTickets],
  );

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.claim-withdraw-batch-text"),
      title: `${t("nav.earn")} · ${t("pages.earn.exit-tickets.withdraw-all")}`,
    });

  const { mutate: claimWithdrawBatch } = useClaimWithdrawBatch({
    onStatusChange(status) {
      const handlers: Partial<Record<typeof status, () => void>> = {
        claiming: onPending,
        completed() {
          onCompleted();
          setIsWithdrawingAll(false);
          setShowWithdrawAllToast(true);
        },
        failed() {
          onFailed();
          setIsWithdrawingAll(false);
        },
      };
      handlers[status]?.();
    },
    onTransactionHash,
    requestIds: readyRequestIds,
  });

  const filterOptions = useMemo(
    () => [
      {
        label: t("pages.earn.exit-tickets.pending-withdrawals"),
        value: "pending",
      },
      {
        label: t("pages.earn.exit-tickets.completed-withdrawals"),
        value: "completed",
      },
    ],
    [t],
  );

  const columns = useMemo(
    () =>
      getColumns({
        isWithdrawingAll,
        onDeleteSuccess() {
          setShowDeleteToast(true);
        },
        onWithdrawingChange(isWithdrawing) {
          setWithdrawingSingleCount((c) => c + (isWithdrawing ? 1 : -1));
        },
        t,
      }),
    [isWithdrawingAll, t],
  );

  // Filter and sort data based on selected filters and ticket status
  const filteredData = useMemo(
    function () {
      if (!data) {
        return [];
      }
      return data
        .filter(function (ticket) {
          const status = getTicketStatus(ticket);
          if (
            selectedFilters.includes("pending") &&
            (status === "cooldown" || status === "ready")
          ) {
            return true;
          }
          if (selectedFilters.includes("completed") && status === "withdrawn") {
            return true;
          }
          return false;
        })
        .sort(function (a, b) {
          // Ready tickets first, then most recent first
          const aReady = getTicketStatus(a) === "ready" ? 0 : 1;
          const bReady = getTicketStatus(b) === "ready" ? 0 : 1;
          if (aReady !== bReady) {
            return aReady - bReady;
          }
          return Number(b.claimableAt) - Number(a.claimableAt);
        });
    },
    [data, selectedFilters],
  );

  function handleWithdrawAll() {
    setIsWithdrawingAll(true);
    claimWithdrawBatch();
  }

  return (
    <div>
      {/* Title row */}
      <TopSection title={t("pages.earn.exit-tickets.title")}>
        <div className="flex items-center gap-3">
          <FilterMenu
            icon={<TableCellsIcon />}
            label={t("pages.earn.exit-tickets.view-settings")}
            onChange={setSelectedFilters}
            sections={[
              {
                label: t("pages.earn.exit-tickets.col-status"),
                options: filterOptions,
              },
            ]}
            selectedValues={selectedFilters}
          />
          <div className="h-3 w-0.5 rounded-full bg-gray-200" />
          {isConnected ? (
            <Button
              disabled={
                readyTickets.length === 0 ||
                isWithdrawingAll ||
                withdrawingSingleCount > 0
              }
              onClick={handleWithdrawAll}
              size="xSmall"
              variant="primary"
            >
              <span className="invisible flex items-center gap-x-1">
                {t("pages.earn.exit-tickets.withdraw-all")}
                {readyTickets.length > 0 && (
                  <Badge variant="blue">{readyTickets.length}</Badge>
                )}
              </span>
              <span className="absolute flex items-center gap-x-1">
                {isWithdrawingAll
                  ? t("pages.earn.exit-tickets.withdrawing")
                  : t("pages.earn.exit-tickets.withdraw-all")}
                {!isWithdrawingAll && readyTickets.length > 0 && (
                  <Badge variant="blue">{readyTickets.length}</Badge>
                )}
              </span>
            </Button>
          ) : (
            <Button onClick={openConnectModal} size="xSmall" variant="primary">
              {t("pages.swap.form.connect-wallet")}
            </Button>
          )}
        </div>
      </TopSection>
      {/* Table */}
      <Table
        columns={columns}
        data={filteredData}
        getRowId={(ticket) => ticket.requestId}
        loading={isLoading}
        maxBodyHeight="280px"
        placeholder={<EmptyState stakingVaultAddress={stakingVaultAddress} />}
        priorityColumnIdsOnSmall={["actions"]}
      />
      {showDeleteToast && (
        <Toast
          closable
          description={t("pages.earn.exit-tickets.delete-toast-description")}
          onClose={() => setShowDeleteToast(false)}
          title={t("pages.earn.exit-tickets.delete-toast-title")}
        />
      )}
      {showWithdrawAllToast && (
        <Toast
          closable
          description={t(
            "pages.earn.exit-tickets.withdraw-all-toast-description",
          )}
          onClose={() => setShowWithdrawAllToast(false)}
          title={t("pages.earn.exit-tickets.withdraw-all-toast-title")}
        />
      )}
    </div>
  );
}
