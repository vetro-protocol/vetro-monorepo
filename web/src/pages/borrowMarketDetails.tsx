import { Breadcrumb } from "components/base/breadcrumb";
import { Button, ButtonLink } from "components/base/button";
import { ChevronIcon } from "components/base/chevronIcon";
import { Dropdown } from "components/base/dropdown";
import { BorrowForm } from "components/borrow/borrowForm";
import { ExistingPositionNotice } from "components/borrow/existingPositionNotice";
import { MarketHeader } from "components/borrow/marketHeader";
import { MarketInfoCards } from "components/borrow/marketInfoCards";
import { BorrowIcon } from "components/navbar/borrowIcon";
import { StripedDivider } from "components/stripedDivider";
import { TokenLogo } from "components/tokenLogo";
import { marketIds } from "constants/borrow";
import { type MarketData, useMarketData } from "hooks/borrow/useMarketData";
import { useMarketsData } from "hooks/borrow/useMarketsData";
import { usePositionInfo } from "hooks/borrow/usePositionInfo";
import { useAmount } from "hooks/useAmount";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { Navigate, useNavigate, useParams } from "react-router";
import { hasActivePosition } from "utils/borrowPosition";
import { type Hash, isHash } from "viem";

const renderMarketItem = (item: MarketData) => (
  <>
    <div className="flex items-center gap-2">
      <TokenLogo
        logoURI={item.collateralToken.logoURI}
        size="small"
        symbol={item.collateralToken.symbol}
      />
      <span>{item.collateralToken.symbol}</span>
    </div>
    <span className="text-gray-500">{item.loanToken.symbol}</span>
  </>
);

const BorrowMarketDetailsLoaded = function ({
  market,
}: {
  market: MarketData;
}) {
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: allMarkets } = useMarketsData(marketIds);
  const otherMarkets = allMarkets.filter((m) => m.marketId !== market.marketId);
  const { data: position } = usePositionInfo(market.marketId);

  const [borrowInput, onBorrowChange] = useAmount();
  const [collateralInput, onCollateralChange] = useAmount();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const hasExistingPosition = hasActivePosition(position);

  return (
    <div className="flex flex-col">
      <Breadcrumb
        backHref="/borrow"
        items={[
          {
            menu: (
              <ButtonLink href="/borrow" size="xSmall" variant="tertiary">
                <BorrowIcon className="size-4" />
                {t("nav.borrow")}
              </ButtonLink>
            ),
          },
          {
            menu: (
              <Dropdown
                getItemKey={(item) => item.marketId}
                items={otherMarkets}
                onChange={(item) =>
                  navigate(`/${lang}/borrow/${item.marketId}`)
                }
                renderItem={renderMarketItem}
                renderTrigger={(isOpen, triggerProps) => (
                  <Button {...triggerProps} size="xSmall" variant="tertiary">
                    <TokenLogo
                      logoURI={market.collateralToken.logoURI}
                      size="small"
                      symbol={market.collateralToken.symbol}
                    />
                    {market.collateralToken.symbol}
                    <ChevronIcon direction={isOpen ? "up" : "down"} />
                  </Button>
                )}
                triggerId="breadcrumb-market-selector"
              />
            ),
          },
        ]}
      />
      <MarketHeader
        collateralToken={market.collateralToken}
        loanToken={market.loanToken}
      />
      <div className="flex flex-col-reverse md:flex-row">
        <div className="flex-1 bg-gray-100">
          <MarketInfoCards market={market} />
        </div>
        <div className="bg-gray-100 md:hidden">
          <StripedDivider />
        </div>
        <div className="flex w-full flex-col md:w-[341px] md:border-b md:border-l md:border-gray-200">
          {hasExistingPosition && !isDrawerOpen ? (
            <ExistingPositionNotice />
          ) : (
            <BorrowForm
              borrowInput={borrowInput}
              collateralInput={collateralInput}
              isDrawerOpen={isDrawerOpen}
              market={market}
              onBorrowChange={onBorrowChange}
              onCollateralChange={onCollateralChange}
              onDrawerOpenChange={setIsDrawerOpen}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const BorrowMarketDetailsContent = function ({ marketId }: { marketId: Hash }) {
  const { data: market, isLoading } = useMarketData(marketId);

  if (isLoading || !market) {
    // TODO handle errors in https://github.com/vetro-protocol/vetro-monorepo/issues/146
    return (
      <div className="p-8">
        <Skeleton count={3} height={40} />
      </div>
    );
  }

  return <BorrowMarketDetailsLoaded market={market} />;
};

export const BorrowMarketDetails = function () {
  const { lang, marketId } = useParams<{ lang: string; marketId: Hash }>();

  if (!marketId || !isHash(marketId) || !marketIds.includes(marketId)) {
    return <Navigate replace to={`/${lang}/not-found`} />;
  }

  return <BorrowMarketDetailsContent marketId={marketId} />;
};
