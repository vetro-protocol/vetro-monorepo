import { AllocationCard } from "components/allocationCard";
import { useCollateralizationRatio } from "hooks/useCollateralizationRatio";
import { usePrices } from "hooks/usePrices";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { formatUsd, tokenAmountToUsd } from "utils/currency";
import { formatPercentage } from "utils/format";
import { getTokenPrice } from "utils/token";

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

  const isError = peggedTokenError || isCollateralizationError || isPricesError;
  const isLoading =
    !isError && (!peggedToken || isCollateralizationLoading || !prices);

  const hasSupply =
    collateralization !== undefined && BigInt(collateralization.supply) > 0n;

  const value = hasSupply ? formatPercentage(collateralization.ratio) : "";

  const hasPrice =
    peggedToken !== undefined && Number(getTokenPrice(peggedToken, prices)) > 0;

  const toUsd = (amount: bigint) =>
    peggedToken ? tokenAmountToUsd({ amount, prices, token: peggedToken }) : 0;

  const formatAmountUsd = (amount: string) =>
    hasPrice ? formatUsd(toUsd(BigInt(amount))) : "-";

  const getItems = function () {
    if (!hasSupply || !peggedToken || !prices) {
      return undefined;
    }
    const surplus = BigInt(collateralization.surplus);
    const isDeficit = surplus < 0n;
    const absoluteSurplus = isDeficit ? -surplus : surplus;
    const surplusUsd = toUsd(absoluteSurplus);
    const percentage = formatPercentage(
      Math.abs(collateralization.ratio - 100),
    );
    const supply = BigInt(collateralization.supply);
    const barSurplus = isDeficit ? 0n : surplus;
    const toBarShare = (amount: bigint) =>
      Number((amount * 10000n) / (supply + barSurplus)) / 100;

    const getSurplusText = function () {
      if (!hasPrice) {
        return "-";
      }
      if (isDeficit) {
        return formatUsd(-surplusUsd);
      }
      return surplusUsd >= 0.01
        ? `+${formatUsd(surplusUsd)}`
        : formatUsd(surplusUsd);
    };

    const getSurplusClassName = function () {
      if (!hasPrice) {
        return undefined;
      }
      return isDeficit ? "text-rose-500" : "text-emerald-500";
    };

    return [
      {
        amount: toBarShare(supply),
        color: "bg-blue-500",
        formattedAmount: formatAmountUsd(collateralization.supply),
        label: t("pages.analytics.supply-label", {
          symbol: peggedToken.symbol,
        }),
      },
      {
        amount: toBarShare(barSurplus),
        amountClassName: getSurplusClassName(),
        color: isDeficit ? "bg-rose-500" : "bg-emerald-400",
        formattedAmount: getSurplusText(),
        label: isDeficit
          ? t("pages.analytics.deficit-label", { percentage })
          : t("pages.analytics.surplus-label", { percentage }),
      },
    ];
  };

  return (
    <AllocationCard
      header={
        collateralization && (
          <>
            <BackingRow
              label={t("pages.analytics.backing-reserves-label")}
              value={formatAmountUsd(collateralization.total)}
            />
            <BackingRow
              isSubRow
              label={t("pages.analytics.liquid-reserves-label")}
              value={formatAmountUsd(collateralization.treasuryTotal)}
            />
            <BackingRow
              isSubRow
              label={t("pages.analytics.strategic-reserves-label")}
              value={formatAmountUsd(collateralization.strategicReserves)}
            />
          </>
        )
      }
      icon={<ShieldIcon />}
      isError={isError}
      isLoading={isLoading}
      items={getItems()}
      label={t("pages.analytics.collateralization-ratio-label")}
      value={value}
    />
  );
};
