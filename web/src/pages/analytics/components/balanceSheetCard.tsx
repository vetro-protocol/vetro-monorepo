import { AllocationCard } from "components/allocationCard";
import { Badge } from "components/base/badge";
import { useBalanceSheet } from "hooks/useBalanceSheet";
import { usePrices } from "hooks/usePrices";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import {
  formatPeggedAmountUsd,
  getCollateralStatus,
  toBalanceSheetItems,
} from "utils/allocations";
import { formatPercentage } from "utils/format";

import { ShieldIcon } from "../icons/shieldIcon";

type ReserveRowProps = {
  isSubRow?: boolean;
  label: string;
  value: string;
};

type BalanceSheetCardProps = {
  peggedToken: TokenWithGateway | undefined;
  peggedTokenError: boolean;
};

const ReserveRow = ({ isSubRow = false, label, value }: ReserveRowProps) => (
  <div
    className={`text-b-medium flex items-center justify-between gap-3 border-b border-gray-200 py-3 ${isSubRow ? "pl-9 text-gray-500" : "pl-4.5 text-gray-900"}`}
  >
    <span>{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

const collateralStatuses = {
  full: {
    labelKey: "pages.analytics.collateral-status-full",
    variant: "gray",
  },
  over: {
    labelKey: "pages.analytics.collateral-status-over",
    variant: "green",
  },
  under: {
    labelKey: "pages.analytics.collateral-status-under",
    variant: "light-red",
  },
} as const;

const BalanceSheetLabel = function ({
  balanceSheet,
}: {
  balanceSheet?: { supply: string; surplus: string };
}) {
  const { t } = useTranslation();
  const statusName = balanceSheet
    ? getCollateralStatus(balanceSheet)
    : undefined;
  const status = statusName ? collateralStatuses[statusName] : undefined;
  return (
    <span className="inline-flex items-center gap-2">
      {t("pages.analytics.balance-sheet-label")}
      {status && <Badge variant={status.variant}>{t(status.labelKey)}</Badge>}
    </span>
  );
};

const getRatioText = (
  balanceSheet: { ratio: number; supply: string } | undefined,
) =>
  balanceSheet && BigInt(balanceSheet.supply) > 0n
    ? formatPercentage(balanceSheet.ratio)
    : "";

export const BalanceSheetCard = function ({
  peggedToken,
  peggedTokenError,
}: BalanceSheetCardProps) {
  const { t } = useTranslation();
  const {
    data: balanceSheet,
    isError: isBalanceSheetError,
    isLoading: isBalanceSheetLoading,
  } = useBalanceSheet(peggedToken?.gatewayAddress);
  const { data: prices, isError: isPricesError } = usePrices();

  const isError = [peggedTokenError, isBalanceSheetError && !balanceSheet].some(
    Boolean,
  );
  const isLoading =
    !isError &&
    (!peggedToken || isBalanceSheetLoading || (!prices && !isPricesError));

  const value = getRatioText(balanceSheet);

  if (!balanceSheet || !peggedToken || isLoading) {
    return (
      <AllocationCard
        icon={<ShieldIcon />}
        isError={isError}
        isLoading={isLoading}
        label={<BalanceSheetLabel />}
        value={value}
      />
    );
  }

  const knownPrices = prices ?? {};

  const formatAmount = (amount: string) =>
    formatPeggedAmountUsd({
      amount: BigInt(amount),
      prices: knownPrices,
      token: peggedToken,
    });

  return (
    <AllocationCard
      header={
        <>
          <ReserveRow
            label={t("pages.analytics.total-reserves-label")}
            value={formatAmount(balanceSheet.total)}
          />
          <ReserveRow
            isSubRow
            label={t("pages.analytics.liquid-reserves-label")}
            value={formatAmount(balanceSheet.treasuryTotal)}
          />
          <ReserveRow
            isSubRow
            label={t("pages.analytics.strategic-reserves-label")}
            value={formatAmount(balanceSheet.strategicReserves)}
          />
        </>
      }
      icon={<ShieldIcon />}
      isError={isError}
      isLoading={isLoading}
      items={toBalanceSheetItems({
        data: balanceSheet,
        labels: {
          deficit: (percentage) =>
            t("pages.analytics.deficit-label", { percentage }),
          supply: t("pages.analytics.supply-label", {
            symbol: peggedToken.symbol,
          }),
          surplus: (percentage) =>
            t("pages.analytics.surplus-label", { percentage }),
          zeroSurplus: t("pages.analytics.zero-surplus-label"),
        },
        prices: knownPrices,
        token: peggedToken,
      })}
      label={<BalanceSheetLabel balanceSheet={balanceSheet} />}
      value={value}
    />
  );
};
