import { type ColumnDef } from "@tanstack/react-table";
import { Table } from "components/base/table";
import { Header } from "components/base/table/header";
import { TopSection } from "components/base/table/topSection";
import { useBorrowAction } from "hooks/borrow/useBorrowAction";
import { type MarketData, useMarketsData } from "hooks/borrow/useMarketsData";
import {
  type PositionData,
  usePositionsData,
} from "hooks/borrow/usePositionsData";
import { useTokenPrices } from "hooks/useTokenPrices";
import { lazy, Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  calculateDailyInterestCost,
  formatHealthFactor,
  formatLtvAsPercentage,
} from "utils/borrowReview";
import { formatFiatNumber, formatPercentage } from "utils/format";
import { getTokenPrice } from "utils/token";
import { type Hash, formatUnits } from "viem";

import { HealthFactor, HealthFactorBar } from "./healthFactor";
import { LiquidationPriceCell } from "./liquidationPriceCell";
import { ManageButton } from "./manageButton";
import { PositionsEmptyState } from "./positionsEmptyState";
import { TokenValueCell } from "./tokenValueCell";

const BorrowMoreDrawerForm = lazy(() =>
  import("./borrowMoreDrawerForm").then((m) => ({
    default: m.BorrowMoreDrawerForm,
  })),
);

const SupplyCollateralDrawerForm = lazy(() =>
  import("./supplyCollateralDrawerForm").then((m) => ({
    default: m.SupplyCollateralDrawerForm,
  })),
);

const WithdrawCollateralDrawerForm = lazy(() =>
  import("./withdrawCollateralDrawerForm").then((m) => ({
    default: m.WithdrawCollateralDrawerForm,
  })),
);

type PositionRow = MarketData & PositionData;

type Props = {
  marketIds: Hash[];
};

export function PositionsTable({ marketIds }: Props) {
  const { t } = useTranslation();
  const { data: marketsData, isLoading: isMarketsLoading } =
    useMarketsData(marketIds);
  const { data: positionsData, isLoading: isPositionsLoading } =
    usePositionsData(marketIds);
  const { data: prices } = useTokenPrices();
  const [{ borrowAction, marketId: actionMarketId }, setBorrowAction] =
    useBorrowAction();

  const clearBorrowAction = () =>
    setBorrowAction({ borrowAction: null, marketId: null });

  const activeMarket =
    actionMarketId !== null
      ? marketsData.find((m) => m.marketId === actionMarketId)
      : undefined;

  const data = useMemo(
    (): PositionRow[] =>
      positionsData.reduce<PositionRow[]>(function (acc, position) {
        const market = marketsData.find(
          (m) => m.marketId === position.marketId,
        );
        if (market) {
          acc.push({ ...market, ...position });
        }
        return acc;
      }, []),
    [marketsData, positionsData],
  );

  const columns = useMemo(
    (): ColumnDef<PositionRow>[] => [
      {
        cell: ({ row }) => (
          <TokenValueCell
            align="left"
            token={row.original.collateralToken}
            value={row.original.collateral}
          />
        ),
        header: () => <Header text={t("pages.borrow.collateral")} />,
        id: "collateral",
        meta: { className: "justify-start grow", width: "160px" },
      },
      {
        cell: ({ row }) => (
          <TokenValueCell
            align="left"
            token={row.original.loanToken}
            value={row.original.borrowAssets}
          />
        ),
        header: () => <Header text={t("pages.borrow.loan")} />,
        id: "loan",
        meta: { className: "justify-start mx-3", width: "120px" },
      },
      {
        cell({ row }) {
          const lltv = formatLtvAsPercentage(row.original.lltv);
          const ltv =
            row.original.ltv != null
              ? formatLtvAsPercentage(row.original.ltv)
              : null;
          const value = formatHealthFactor(row.original.healthFactor);
          return (
            <div className="flex flex-col gap-y-1">
              <span className="text-b-medium">
                <HealthFactor lltv={lltv} ltv={ltv} value={value} />
              </span>
              <HealthFactorBar lltv={lltv} ltv={ltv} />
            </div>
          );
        },
        header: () => <Header text={t("pages.borrow.health-factor")} />,
        id: "health-factor",
        meta: { className: "justify-start mx-3", width: "96px" },
      },
      {
        cell: ({ row }) => (
          <LiquidationPriceCell
            collateralToken={row.original.collateralToken}
            liquidationPrice={row.original.liquidationPrice}
            loanToken={row.original.loanToken}
            prices={prices}
          />
        ),
        header: () => <Header text={t("pages.borrow.liquidation-price")} />,
        id: "liq-price",
        meta: { className: "justify-start mx-3", width: "120px" },
      },
      {
        cell: ({ row }) => (
          <div className="flex flex-col items-center">
            <span className="text-b-medium text-gray-900">
              {row.original.ltv != null
                ? `${formatPercentage(formatLtvAsPercentage(row.original.ltv))}`
                : "-"}
            </span>
            <span className="text-caption text-gray-500 *:w-full">
              {t("pages.borrow.max-lltv", {
                value: formatPercentage(
                  formatLtvAsPercentage(row.original.lltv),
                ),
              })}
            </span>
          </div>
        ),
        header: () => <Header align="center" text={t("pages.borrow.ltv")} />,
        id: "ltv",
        meta: { className: "justify-center mx-3", width: "64px" },
      },
      {
        cell({ row }) {
          const borrowAmount = Number(
            formatUnits(
              row.original.borrowAssets,
              row.original.loanToken.decimals,
            ),
          );
          const dailyInterest = calculateDailyInterestCost({
            borrowAmount,
            borrowApy: row.original.borrowApy,
          });
          const loanUsdPrice = parseFloat(
            getTokenPrice(row.original.loanToken, prices),
          );
          const dailyInterestUsd = dailyInterest * loanUsdPrice;

          return (
            <div className="flex flex-col items-center">
              <span className="text-h5 text-blue-500">
                {formatPercentage(row.original.borrowApy * 100)}
              </span>
              <span className="text-caption text-gray-500">
                {t("pages.borrow.daily-interest-per-day", {
                  value: formatFiatNumber(dailyInterestUsd),
                })}
              </span>
            </div>
          );
        },
        header: () => (
          <Header align="center" text={t("pages.borrow.borrow-apr")} />
        ),
        id: "borrow-apr",
        meta: { className: "justify-center mx-3", width: "80px" },
      },
      {
        cell: ({ row }) => (
          <ManageButton
            marketId={row.original.marketId}
            onAction={(action) =>
              setBorrowAction({
                borrowAction: action,
                marketId: row.original.marketId,
              })
            }
          />
        ),
        header: () => <Header text="" />,
        id: "actions",
        meta: { className: "justify-end", width: "100px" },
      },
    ],
    [prices, setBorrowAction, t],
  );

  return (
    <>
      <TopSection title={t("pages.borrow.positions-title")} />
      <Table
        columns={columns}
        data={data}
        loading={isMarketsLoading || isPositionsLoading}
        placeholder={<PositionsEmptyState />}
      />
      {borrowAction === "borrow-more" && activeMarket && (
        <Suspense>
          <BorrowMoreDrawerForm
            market={activeMarket}
            onClose={clearBorrowAction}
          />
        </Suspense>
      )}
      {borrowAction === "supply-collateral" && activeMarket && (
        <Suspense>
          <SupplyCollateralDrawerForm
            market={activeMarket}
            onClose={clearBorrowAction}
          />
        </Suspense>
      )}
      {borrowAction === "withdraw-collateral" && activeMarket && (
        <Suspense>
          <WithdrawCollateralDrawerForm
            market={activeMarket}
            onClose={clearBorrowAction}
          />
        </Suspense>
      )}
    </>
  );
}
