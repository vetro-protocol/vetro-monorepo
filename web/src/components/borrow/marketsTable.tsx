import { type ColumnDef } from "@tanstack/react-table";
import { I18nLink } from "components/base/i18nLink";
import { Table } from "components/base/table";
import { Header } from "components/base/table/header";
import { TopSection } from "components/base/table/topSection";
import { CollateralCell } from "components/borrow/collateralCell";
import { TokenValueCell } from "components/borrow/tokenValueCell";
import { TokenLogo } from "components/tokenLogo";
import { type MarketData, useMarketsData } from "hooks/borrow/useMarketsData";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type Hash, formatUnits } from "viem";

type Props = {
  marketIds: Hash[];
};

export function MarketsTable({ marketIds }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useMarketsData(marketIds);

  const columns = useMemo(
    (): ColumnDef<MarketData>[] => [
      {
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <TokenLogo {...row.original.collateralToken} />
            <span className="text-b-medium text-gray-900">
              {row.original.collateralToken.symbol}
            </span>
          </div>
        ),
        header: () => <Header text={t("pages.borrow.collateral")} />,
        id: "collateral",
        meta: { width: "128px" },
      },
      {
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <TokenLogo {...row.original.loanToken} />
            <span className="text-b-medium text-gray-900">
              {row.original.loanToken.symbol}
            </span>
          </div>
        ),
        header: () => <Header text={t("pages.borrow.loan")} />,
        id: "loan",
        meta: { className: "grow", width: "128px" },
      },
      {
        cell: ({ row }) => (
          <CollateralCell
            marketId={row.original.marketId}
            token={row.original.collateralToken}
          />
        ),
        header: () => <Header text={t("pages.borrow.pool-size")} />,
        id: "pool-size",
        meta: { className: "justify-end mr-6", width: "128px" },
      },
      {
        cell: ({ row }) => (
          <TokenValueCell
            token={row.original.loanToken}
            value={row.original.liquidity}
          />
        ),
        header: () => <Header text={t("pages.borrow.available-to-borrow")} />,
        id: "available",
        meta: { className: "justify-end mr-6", width: "128px" },
      },
      {
        cell: ({ row }) => (
          <span className="text-b-medium text-gray-900">
            {formatUnits(row.original.lltv * 100n, 18)}%
          </span>
        ),
        header: () => <Header align="center" text={t("pages.borrow.ltv")} />,
        id: "ltv",
        meta: { className: "justify-center mx-3", width: "48px" },
      },
      {
        cell: ({ row }) => (
          <span className="text-h5 text-blue-500">
            {(row.original.borrowApy * 100).toFixed(2)}%
          </span>
        ),
        header: () => (
          <Header align="center" text={t("pages.borrow.borrow-apr")} />
        ),
        id: "borrow-apr",
        meta: { className: "justify-center mx-3", width: "48px" },
      },
      {
        cell: ({ row }) => (
          <I18nLink
            aria-label={t("pages.borrow.market-details")}
            className="button--base button-secondary button-x-small button-icon"
            to={`/borrow/${row.original.marketId}`}
          >
            <svg
              fill="none"
              height="16"
              viewBox="0 0 16 16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06-1.06L9.19 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                fill="currentColor"
              />
            </svg>
          </I18nLink>
        ),
        header: () => <Header text="" />,
        id: "action",
        meta: { className: "justify-end", width: "56px" },
      },
    ],
    [t],
  );

  return (
    <>
      <TopSection title={t("pages.borrow.markets-title")} />
      <Table columns={columns} data={data} loading={isLoading} />
    </>
  );
}
