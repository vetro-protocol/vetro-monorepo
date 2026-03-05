import { Badge } from "components/base/badge";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { RenderFiatValue } from "components/base/fiatValue";
import { StripedDivider } from "components/stripedDivider";
import { useMarketCollateral } from "hooks/borrow/useMarketCollateral";
import { type MarketData } from "hooks/borrow/useMarketData";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatPercentage } from "utils/format";
import { type Hash, formatUnits } from "viem";

import { HistoricApr } from "./historicApr";

const SparkleIcon = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M5 4c.177 0 .347.062.482.174a.75.75 0 0 1 .256.442l.252 1.388a1.5 1.5 0 0 0 1.006 1.006l1.388.252a.75.75 0 0 1 .442.256.75.75 0 0 1-.442.738l-1.388.252a1.5 1.5 0 0 0-1.006 1.006l-.252 1.388a.75.75 0 0 1-.738.442.75.75 0 0 1-.738-.442l-.252-1.388a1.5 1.5 0 0 0-1.006-1.006L1.616 8.738A.75.75 0 0 1 1.174 8.482.75.75 0 0 1 1.616 7.262l1.388-.252a1.5 1.5 0 0 0 1.006-1.006l.252-1.388A.75.75 0 0 1 4.52 4.174.75.75 0 0 1 5 4Zm7-3a.75.75 0 0 1 .721.544l.195.682a1.5 1.5 0 0 0 1.053 1.053l.682.195a.75.75 0 0 1 0 1.442l-.682.195a1.5 1.5 0 0 0-1.053 1.053l-.195.682a.75.75 0 0 1-1.442 0l-.195-.682a1.5 1.5 0 0 0-1.053-1.053l-.682-.195a.75.75 0 0 1 0-1.442l.682-.195a1.5 1.5 0 0 0 1.053-1.053l.195-.682A.75.75 0 0 1 12 1Zm-2 10a.75.75 0 0 1 .728.568c.043.17.13.325.255.449.124.124.28.212.45.255a.75.75 0 0 1 0 1.456 1 1 0 0 0-.45.255 1 1 0 0 0-.255.449.75.75 0 0 1-1.456 0 1 1 0 0 0-.255-.449 1 1 0 0 0-.449-.255.75.75 0 0 1 0-1.456 1 1 0 0 0 .449-.255 1 1 0 0 0 .255-.449A.75.75 0 0 1 10 11Z"
      fill="#416BFF"
      fillRule="evenodd"
    />
  </svg>
);

const BoltIcon = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M9.58 1.077a.75.75 0 0 1 .405 1.82L9.165 6h4.085a.75.75 0 0 1 .567 1.241l-6.5 7.5a.75.75 0 0 1-1.332-.844L6.835 10H2.75a.75.75 0 0 1-.567-1.241l6.5-7.5a.75.75 0 0 1 .897-.182Z"
      fill="#416BFF"
      fillRule="evenodd"
    />
  </svg>
);

const TrendIcon = () => (
  <svg
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M9.808 4.057a.75.75 0 0 1 .92-.527l3.116.849a.75.75 0 0 1 .528.916l-.823 3.12a.75.75 0 0 1-1.45-.13l.337-1.282a18.8 18.8 0 0 0-3.609 3.056.75.75 0 0 1-1.07.01L6 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l1.756 1.755a20.1 20.1 0 0 1 3.508-2.85l-1.46-.398a.75.75 0 0 1-.526-.92Z"
      fill="#416BFF"
      fillRule="evenodd"
    />
  </svg>
);

const InfoCard = ({
  badge,
  children,
  icon,
  label,
}: {
  badge?: ReactNode;
  children: ReactNode;
  icon: ReactNode;
  label: string;
}) => (
  <div className="border-b border-gray-200 px-3 max-md:first:border-t">
    <div className="relative flex -translate-y-px flex-col items-start gap-y-3 border-t border-blue-500 py-6 *:flex">
      <div className="flex w-full items-center justify-between">
        <span className="text-b-medium text-gray-900">{label}</span>
        {icon}
      </div>
      <span className="text-h3">{children}</span>
      {badge ? <Badge>{badge}</Badge> : null}
    </div>
  </div>
);

export function MarketInfoCards({
  market,
  marketId,
}: {
  market: MarketData;
  marketId: Hash;
}) {
  const { t } = useTranslation();
  const { data: collateralAssets, status: collateralStatus } =
    useMarketCollateral(marketId);

  return (
    <div className="flex flex-col">
      <div className="grid border-b border-gray-200 xl:grid-cols-[1fr_3.5rem_1fr]">
        <div className="xl:pl-14">
          <InfoCard
            badge={
              <RenderCryptoValue
                status={collateralStatus}
                token={market.collateralToken}
                value={collateralAssets}
                showSymbol
              />
            }
            icon={<SparkleIcon />}
            label={t("pages.borrow.pool-size")}
          >
            <span className="mr-1">$</span>
            <RenderFiatValue
              queryStatus={collateralStatus}
              token={market.collateralToken}
              value={collateralAssets}
            />
          </InfoCard>
        </div>
        <div className="hidden size-full border-b border-gray-200 xl:block" />
        <div className="xl:pr-14">
          <InfoCard
            badge={
              <RenderCryptoValue
                token={market.loanToken}
                value={market.liquidity}
                showSymbol
              />
            }
            icon={<SparkleIcon />}
            label={t("pages.borrow.available-to-borrow")}
          >
            <span className="mr-1">$</span>
            <RenderFiatValue
              token={market.loanToken}
              value={market.liquidity}
            />
          </InfoCard>
        </div>
        <div className="xl:pl-14 xl:*:border-0">
          <InfoCard icon={<BoltIcon />} label={t("pages.borrow.ltv")}>
            {formatUnits(market.lltv * 100n, 18)}%
          </InfoCard>
        </div>
        <div className="-mb-px hidden size-full xl:block" />
        <div className="xl:pr-14 xl:*:border-0">
          <InfoCard icon={<TrendIcon />} label={t("pages.borrow.borrow-apr")}>
            {formatPercentage(market.borrowApy * 100)}
          </InfoCard>
        </div>
      </div>
      <div className="w-full border-b border-gray-200 max-lg:hidden">
        <StripedDivider variant="small" />
      </div>
      <HistoricApr />
    </div>
  );
}
