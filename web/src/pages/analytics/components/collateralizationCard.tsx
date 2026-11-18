import { AllocationCard } from "components/allocationCard";
import { useCollateralizationRatio } from "hooks/useCollateralizationRatio";
import { usePrices } from "hooks/usePrices";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import {
  formatPeggedAmountUsd,
  toCollateralizationItems,
} from "utils/allocations";
import { formatPercentage } from "utils/format";

import { ShieldIcon } from "../icons/shieldIcon";

type Props = {
  peggedToken: TokenWithGateway | undefined;
  peggedTokenError: boolean;
};

const BackingRow = ({
  isSubRow = false,
  label,
  value,
}: {
  isSubRow?: boolean;
  label: string;
  value: string;
}) => (
  <div
    className={`text-b-medium flex items-center justify-between gap-3 border-b border-gray-200 py-3 ${isSubRow ? "pl-9 text-gray-500" : "pl-4.5 text-gray-900"}`}
  >
    <span>{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

const getRatioText = (
  collateralization: { ratio: number; supply: string } | undefined,
) =>
  collateralization && BigInt(collateralization.supply) > 0n
    ? formatPercentage(collateralization.ratio)
    : "";

export const CollateralizationCard = function ({
  peggedToken,
  peggedTokenError,
}: Props) {
  const { t } = useTranslation();
  const {
    data: collateralization,
    isError: isCollateralizationError,
    isLoading: isCollateralizationLoading,
  } = useCollateralizationRatio(peggedToken?.gatewayAddress);
  const { data: prices, isError: isPricesError } = usePrices();

  const isError = peggedTokenError || isCollateralizationError;
  const isLoading =
    !isError &&
    (!peggedToken || isCollateralizationLoading || (!prices && !isPricesError));

  const value = getRatioText(collateralization);

  if (!collateralization || !peggedToken || isLoading) {
    return (
      <AllocationCard
        icon={<ShieldIcon />}
        isError={isError}
        isLoading={isLoading}
        label={t("pages.analytics.collateralization-ratio-label")}
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
          <BackingRow
            label={t("pages.analytics.backing-reserves-label")}
            value={formatAmount(collateralization.total)}
          />
          <BackingRow
            isSubRow
            label={t("pages.analytics.liquid-reserves-label")}
            value={formatAmount(collateralization.treasuryTotal)}
          />
          <BackingRow
            isSubRow
            label={t("pages.analytics.strategic-reserves-label")}
            value={formatAmount(collateralization.strategicReserves)}
          />
        </>
      }
      icon={<ShieldIcon />}
      isError={isError}
      isLoading={isLoading}
      items={toCollateralizationItems({
        data: collateralization,
        labels: {
          deficit: (percentage) =>
            t("pages.analytics.deficit-label", { percentage }),
          supply: t("pages.analytics.supply-label", {
            symbol: peggedToken.symbol,
          }),
          surplus: (percentage) =>
            t("pages.analytics.surplus-label", { percentage }),
        },
        prices: knownPrices,
        token: peggedToken,
      })}
      label={t("pages.analytics.collateralization-ratio-label")}
      value={value}
    />
  );
};
