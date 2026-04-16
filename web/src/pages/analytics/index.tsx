import { gatewayAddresses } from "@vetro-protocol/gateway";
import { PageTitle } from "components/base/pageTitle";
import { StripedDivider } from "components/stripedDivider";
import { useAnalyticsTotals } from "hooks/useAnalyticsTotals";
import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { useCollateralizationRatio } from "hooks/useCollateralizationRatio";
import { usePeggedToken } from "hooks/usePeggedToken";
import { useVariableStakeExitQueue } from "hooks/useVariableStakeExitQueue";
import { useWhitelistedTokens } from "hooks/useWhitelistedTokens";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";
import { formatPercentage } from "utils/format";
import { formatUnits } from "viem";

import { AllocationCard } from "./components/allocationCard";
import { DatabaseIcon } from "./icons/databaseIcon";
import { ExitQueueIcon } from "./icons/exitQueueIcon";
import { PieChartIcon } from "./icons/pieChartIcon";
import { ShieldIcon } from "./icons/shieldIcon";
import { StakingIcon } from "./icons/stakingIcon";
import {
  assignColor,
  toCollateralizationItems,
  toReserveBufferAmount,
  toTvlItems,
  toYieldItems,
} from "./utils";

type AnalyticsTotals = NonNullable<
  ReturnType<typeof useAnalyticsTotals>["data"]
>;

type PeggedToken = NonNullable<ReturnType<typeof usePeggedToken>["data"]>;
type WhitelistedTokens = NonNullable<
  ReturnType<typeof useWhitelistedTokens>["data"]
>;

const toTotalsValues = function (
  totals: AnalyticsTotals | undefined,
  decimals: number,
) {
  if (!totals) return ["", ""];
  return [
    formatUsd(Number(formatUnits(BigInt(totals.vusdMinted), decimals))),
    formatUsd(Number(formatUnits(BigInt(totals.vusdStaked), decimals))),
  ];
};

const toCollateralizationValue = function (
  data: { total: number; vusdSupply: number } | undefined,
) {
  if (!data || data.vusdSupply <= 0) return "";
  return formatPercentage((data.total / data.vusdSupply) * 100);
};

const AllocationRow = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <>
    <div
      className={`flex flex-col border-y border-gray-200 bg-gray-100 md:flex-row ${className}`}
    >
      {children}
    </div>
    <div className="bg-gray-100">
      <StripedDivider />
    </div>
  </>
);

type AnalyticsContentProps = {
  peggedToken: PeggedToken;
  whitelistedTokens: WhitelistedTokens;
};

const AnalyticsContent = function ({
  peggedToken,
  whitelistedTokens,
}: AnalyticsContentProps) {
  const { t } = useTranslation();
  const {
    data: treasury,
    isError: isTreasuryError,
    isLoading: isTreasuryLoading,
  } = useAnalyticsTreasury();
  const {
    data: totals,
    isError: isTotalsError,
    isLoading: isTotalsLoading,
  } = useAnalyticsTotals();
  const {
    data: exitQueue,
    isError: isExitQueueError,
    isLoading: isExitQueueLoading,
  } = useVariableStakeExitQueue();
  const {
    data: collateralization,
    isError: isCollateralizationError,
    isLoading: isCollateralizationLoading,
  } = useCollateralizationRatio();

  const tokens = { treasuryTokens: treasury, whitelistedTokens };

  const [tvlValue, stakedValue] = toTotalsValues(totals, peggedToken.decimals);

  const exitQueueValue = exitQueue
    ? formatUsd(
        Number(formatUnits(exitQueue.vusdInCooldown, peggedToken.decimals)),
      )
    : "";

  const yieldItems = toYieldItems(tokens);
  const bufferAmount = toReserveBufferAmount(tokens);
  const bufferItem =
    bufferAmount > 0
      ? {
          amount: bufferAmount,
          color: assignColor(yieldItems.length),
          label: t("pages.analytics.reserve-buffer-label"),
        }
      : null;
  const yieldValue = treasury
    ? t("pages.analytics.yield-value", { count: yieldItems.length })
    : "";

  const collateralizationValue = toCollateralizationValue(collateralization);
  const collateralizationItems = toCollateralizationItems(collateralization, {
    liquidReserves: t("pages.analytics.liquid-reserves-label"),
    strategicReserves: t("pages.analytics.strategic-reserves-label"),
    surplus: t("pages.analytics.surplus-label"),
  })?.map((item, index) => ({ ...item, color: assignColor(index) }));

  return (
    <>
      <AllocationRow className="md:divide-x md:divide-gray-200">
        <AllocationCard
          icon={<DatabaseIcon />}
          isError={isTreasuryError || isTotalsError}
          isLoading={isTreasuryLoading || isTotalsLoading}
          items={toTvlItems(tokens)}
          label={t("pages.analytics.tvl-label")}
          value={tvlValue}
        />
        <AllocationCard
          icon={<PieChartIcon />}
          isError={isTreasuryError}
          isLoading={isTreasuryLoading}
          items={bufferItem ? [...yieldItems, bufferItem] : yieldItems}
          label={t("pages.analytics.yield-label")}
          value={yieldValue}
        />
      </AllocationRow>
      <AllocationRow className="md:divide-x md:divide-gray-200">
        <AllocationCard
          icon={<StakingIcon />}
          isError={isTotalsError}
          isLoading={isTotalsLoading}
          label={t("pages.analytics.staked-label")}
          value={stakedValue}
        />
        <AllocationCard
          icon={<ExitQueueIcon />}
          isError={isExitQueueError}
          isLoading={isExitQueueLoading}
          label={t("pages.analytics.exit-queue-label")}
          value={exitQueueValue}
        />
      </AllocationRow>
      <AllocationRow className="md:justify-center">
        <div className="md:w-1/2">
          <AllocationCard
            formatAmount={formatPercentage}
            icon={<ShieldIcon />}
            isError={isCollateralizationError}
            isLoading={isCollateralizationLoading}
            items={collateralizationItems}
            label={t("pages.analytics.collateralization-ratio-label")}
            value={collateralizationValue}
          />
        </div>
      </AllocationRow>
    </>
  );
};

export const Analytics = function () {
  const { t } = useTranslation();
  const { data: peggedToken, isError: isPeggedTokenError } = usePeggedToken(
    // The analytics page is VUSD only, so this is ok
    gatewayAddresses[0],
  );
  const { data: whitelistedTokens, isError: isWhitelistedTokensError } =
    // The analytics page is VUSD only, so this is ok
    useWhitelistedTokens(gatewayAddresses[0]);

  const isGateError = isPeggedTokenError || isWhitelistedTokensError;
  const isGateLoading = !isGateError && (!peggedToken || !whitelistedTokens);

  return (
    <div className="flex flex-col">
      <PageTitle value={t("pages.analytics.title")} />
      {peggedToken && whitelistedTokens ? (
        <AnalyticsContent
          peggedToken={peggedToken}
          whitelistedTokens={whitelistedTokens}
        />
      ) : (
        <>
          <AllocationRow className="md:divide-x md:divide-gray-200">
            <AllocationCard
              icon={<DatabaseIcon />}
              isError={isGateError}
              isLoading={isGateLoading}
              items={[]}
              label={t("pages.analytics.tvl-label")}
              value=""
            />
            <AllocationCard
              icon={<PieChartIcon />}
              isError={isGateError}
              isLoading={isGateLoading}
              items={[]}
              label={t("pages.analytics.yield-label")}
              value=""
            />
          </AllocationRow>
          <AllocationRow className="md:divide-x md:divide-gray-200">
            <AllocationCard
              icon={<StakingIcon />}
              isError={isGateError}
              isLoading={isGateLoading}
              label={t("pages.analytics.staked-label")}
              value=""
            />
            <AllocationCard
              icon={<ExitQueueIcon />}
              isError={isGateError}
              isLoading={isGateLoading}
              label={t("pages.analytics.exit-queue-label")}
              value=""
            />
          </AllocationRow>
          <AllocationRow className="md:justify-center">
            <div className="md:w-1/2">
              <AllocationCard
                formatAmount={formatPercentage}
                icon={<ShieldIcon />}
                isError={isGateError}
                isLoading={isGateLoading}
                items={[]}
                label={t("pages.analytics.collateralization-ratio-label")}
                value=""
              />
            </div>
          </AllocationRow>
        </>
      )}
    </div>
  );
};
