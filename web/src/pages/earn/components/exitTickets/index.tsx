import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "components/base/badge";
import { Button } from "components/base/button";
import { FilterMenu } from "components/base/filterMenu";
import { StatusBadge } from "components/base/statusBadge";
import { Table } from "components/base/table";
import { Header } from "components/base/table/header";
import { TableCellsIcon } from "pages/earn/icons/tableCellsIcon";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "utils/date";

import { useCooldownDuration } from "../../hooks/useCooldownDuration";
import { useExitTickets } from "../../hooks/useExitTickets";
import type { ExitTicket } from "../../types";

import { ActionsCell } from "./actionsCell";
import { CooldownCell } from "./cooldownCell";
import { EmptyState } from "./emptyState";
import { getTicketStatus } from "./getTicketStatus";
import { TxsCell } from "./txsCell";
import { WithdrawalCell } from "./withdrawalCell";

const statusLabels = {
  cooldown: "pages.earn.exit-tickets.cooldown-in-progress",
  ready: "pages.earn.exit-tickets.ready-to-withdraw",
  withdrawn: "pages.earn.exit-tickets.withdrawn",
} as const;

const getColumns = (
  cooldownDuration: bigint | undefined,
  language: string,
  t: ReturnType<typeof useTranslation>["t"],
): ColumnDef<ExitTicket>[] => [
  {
    cell: ({ row }) => (
      <span className="text-xsm font-normal text-gray-500">
        {/* Derive creation date by subtracting cooldown duration from claimableAt */}
        {cooldownDuration !== undefined
          ? formatDate(
              Number(row.original.claimableAt) - Number(cooldownDuration),
              language,
            )
          : "-"}
      </span>
    ),
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
    meta: { width: "112px" },
  },
  {
    cell: ({ row }) => <ActionsCell ticket={row.original} />,
    header: () => <Header text={t("pages.earn.exit-tickets.actions")} />,
    id: "actions",
    meta: { className: "justify-end", width: "150px" },
  },
];

export function ExitTickets() {
  const { data: cooldownDuration } = useCooldownDuration();
  const { data, isLoading } = useExitTickets();
  const { i18n, t } = useTranslation();
  const [selectedFilters, setSelectedFilters] = useState([
    "completed",
    "pending",
  ]);

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
    () => getColumns(cooldownDuration, i18n.language, t),
    [cooldownDuration, i18n.language, t],
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

  const readyCount = useMemo(
    () =>
      (data ?? []).filter((ticket) => getTicketStatus(ticket) === "ready")
        .length,
    [data],
  );

  return (
    <div>
      {/* Title row */}
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-100 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-16 md:py-5">
        <h4 className="text-base font-semibold tracking-tight text-gray-900">
          {t("pages.earn.exit-tickets.title")}
        </h4>
        <div className="flex items-center gap-3">
          <FilterMenu
            icon={<TableCellsIcon />}
            label={t("pages.earn.exit-tickets.view-settings")}
            onChange={setSelectedFilters}
            options={filterOptions}
            selectedValues={selectedFilters}
          />
          <div className="h-3 w-0.5 rounded-full bg-gray-200" />
          <Button size="xSmall" variant="primary">
            {t("pages.earn.exit-tickets.withdraw-all")}
            {readyCount > 0 && <Badge variant="blue">{readyCount}</Badge>}
          </Button>
        </div>
      </div>
      {/* Table */}
      <Table
        columns={columns}
        data={filteredData}
        loading={isLoading}
        maxBodyHeight="280px"
        placeholder={<EmptyState />}
        priorityColumnIdsOnSmall={["actions"]}
      />
    </div>
  );
}
