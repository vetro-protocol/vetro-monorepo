import { Badge } from "components/base/badge";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { DollarSign } from "components/base/dollarSign";
import { RenderFiatValue } from "components/base/fiatValue";
import { InfoCard } from "components/base/infoCard";
import { BoltIcon } from "components/icons/boltIcon";
import { SparklesIcon } from "components/icons/sparklesIcon";
import { TrendingUpIcon } from "components/icons/trendingUpIcon";
import { StripedDivider } from "components/stripedDivider";
import { useMarketCollateral } from "hooks/borrow/useMarketCollateral";
import { type MarketData } from "hooks/borrow/useMarketData";
import { useTranslation } from "react-i18next";
import { formatPercentage } from "utils/format";
import { formatUnits } from "viem";

import { HistoricApr } from "./historicApr";

export function MarketInfoCards({ market }: { market: MarketData }) {
  const { t } = useTranslation();
  const collateral = useMarketCollateral(market.marketId);

  return (
    <div className="flex flex-col">
      <div className="grid border-b border-gray-200 xl:grid-cols-[1fr_3.5rem_1fr]">
        <div className="xl:pl-14">
          <InfoCard
            {...collateral}
            icon={<SparklesIcon className="text-blue-500" />}
            label={t("pages.borrow.pool-size")}
            render={(collateralAssets) => (
              <>
                <DollarSign />
                <RenderFiatValue
                  token={market.collateralToken}
                  value={collateralAssets}
                />
              </>
            )}
            subtitle={
              <Badge>
                <RenderCryptoValue
                  showSymbol
                  status={collateral.status}
                  token={market.collateralToken}
                  value={collateral.data}
                />
              </Badge>
            }
          />
        </div>
        <div className="hidden size-full border-b border-gray-200 xl:block" />
        <div className="xl:pr-14">
          <InfoCard
            data={market.liquidity}
            icon={<SparklesIcon className="text-blue-500" />}
            label={t("pages.borrow.available-to-borrow")}
            render={(liquidity) => (
              <>
                <DollarSign />
                <RenderFiatValue token={market.loanToken} value={liquidity} />
              </>
            )}
            subtitle={
              <Badge>
                <RenderCryptoValue
                  showSymbol
                  token={market.loanToken}
                  value={market.liquidity}
                />
              </Badge>
            }
          />
        </div>
        <div className="xl:pl-14 xl:*:border-0">
          <InfoCard
            data={market.lltv}
            icon={<BoltIcon className="text-blue-500" />}
            label={t("pages.borrow.ltv")}
            render={(lltv) => `${formatUnits(lltv * 100n, 18)}%`}
          />
        </div>
        <div className="-mb-px hidden size-full xl:block" />
        <div className="xl:pr-14 xl:*:border-0">
          <InfoCard
            data={market.borrowApy}
            icon={<TrendingUpIcon className="text-blue-500" />}
            label={t("pages.borrow.borrow-apr")}
            render={(borrowApy) => formatPercentage(borrowApy * 100)}
          />
        </div>
      </div>
      <div className="w-full border-b border-gray-200 max-lg:hidden">
        <StripedDivider variant="small" />
      </div>
      <HistoricApr marketId={market.marketId} />
    </div>
  );
}
