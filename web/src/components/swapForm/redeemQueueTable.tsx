import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "components/base/badge";
import { Button, ButtonIcon } from "components/base/button";
import { StatusBadge } from "components/base/statusBadge";
import { Table } from "components/base/table";
import { Header } from "components/base/table/header";
import { TokenLogo } from "components/tokenLogo";
import { Tooltip } from "components/tooltip";
import { useCountdown } from "hooks/useCountdown";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatCountdown } from "utils/countdown";
import { formatAmount } from "utils/token";

type RedeemQueueRow = {
  amountLocked: bigint;
  claimableAt: bigint;
};

type Props = {
  data: RedeemQueueRow[];
  loading: boolean;
  onCancelRedeem: () => void;
  onRedeem: () => void;
  placeholder: ReactNode;
  vusd: Token;
};

function StatusCell({ claimableAt }: { claimableAt: bigint }) {
  const { t } = useTranslation();
  const remainingSeconds = useCountdown(claimableAt);
  const isReady = remainingSeconds === 0;

  return isReady ? (
    <StatusBadge variant="ready">
      {t("pages.swap.redeem-queue.ready-to-redeem")}
    </StatusBadge>
  ) : (
    <StatusBadge variant="cooldown">
      {t("pages.swap.redeem-queue.cooldown-in-progress")}
    </StatusBadge>
  );
}

function ActionsCell({
  claimableAt,
  onCancelRedeem,
  onRedeem,
}: {
  claimableAt: bigint;
  onCancelRedeem: () => void;
  onRedeem: () => void;
}) {
  const { t } = useTranslation();
  const remainingSeconds = useCountdown(claimableAt);
  const isReady = remainingSeconds === 0;

  return (
    <div className="flex items-center gap-3">
      <Button
        disabled={!isReady}
        onClick={onRedeem}
        size="xSmall"
        variant="primary"
      >
        {t("pages.swap.redeem-queue.redeem")}
        {!isReady && (
          <span className="w-22.5 *:w-full">
            <Badge variant="blue">
              {t("pages.swap.redeem-queue.ready-on", {
                time: formatCountdown(remainingSeconds),
              })}
            </Badge>
          </span>
        )}
      </Button>
      <Tooltip content={t("pages.swap.redeem-queue.cancel-redeem")}>
        <ButtonIcon
          aria-label={t("pages.swap.redeem-queue.cancel-redeem")}
          onClick={onCancelRedeem}
          variant="secondary"
        >
          <svg
            fill="none"
            height="16"
            viewBox="0 0 16 16"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.28 4.28a.75.75 0 0 1 1.06 0L8 6.94l2.66-2.66a.75.75 0 1 1 1.06 1.06L9.06 8l2.66 2.66a.75.75 0 1 1-1.06 1.06L8 9.06l-2.66 2.66a.75.75 0 0 1-1.06-1.06L6.94 8 4.28 5.34a.75.75 0 0 1 0-1.06Z"
              fill="currentColor"
            />
          </svg>
        </ButtonIcon>
      </Tooltip>
    </div>
  );
}

export function RedeemQueueTable({
  data,
  loading,
  onCancelRedeem,
  onRedeem,
  placeholder,
  vusd,
}: Props) {
  const { t } = useTranslation();

  const columns = useMemo(
    (): ColumnDef<RedeemQueueRow>[] => [
      {
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <TokenLogo {...vusd} />
            <span className="text-b-medium text-gray-900">
              {formatAmount({
                amount: row.original.amountLocked,
                decimals: vusd.decimals,
                isError: false,
              })}{" "}
              {vusd.symbol}
            </span>
          </div>
        ),
        header: () => (
          <Header text={t("pages.swap.redeem-queue.redeemable-balance")} />
        ),
        id: "redeemable-balance",
        meta: { width: "200px" },
      },
      {
        cell: ({ row }) => (
          <StatusCell claimableAt={row.original.claimableAt} />
        ),
        header: () => <Header text={t("pages.swap.redeem-queue.status")} />,
        id: "status",
        meta: { width: "200px" },
      },
      {
        cell: ({ row }) => (
          <ActionsCell
            claimableAt={row.original.claimableAt}
            onCancelRedeem={onCancelRedeem}
            onRedeem={onRedeem}
          />
        ),
        header: () => <Header text={t("pages.swap.redeem-queue.action")} />,
        id: "action",
        meta: { className: "justify-end", width: "250px" },
      },
    ],
    [onCancelRedeem, onRedeem, t, vusd],
  );

  return (
    <Table
      columns={columns}
      data={data}
      loading={loading}
      placeholder={placeholder}
      priorityColumnIdsOnSmall={["action"]}
      skeletonRowCount={1}
    />
  );
}
