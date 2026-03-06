import { BorrowForm } from "components/borrow/borrowForm";
import { ExistingPositionNotice } from "components/borrow/existingPositionNotice";
import { MarketHeader } from "components/borrow/marketHeader";
import { MarketInfoCards } from "components/borrow/marketInfoCards";
import { StripedDivider } from "components/stripedDivider";
import { type MarketData, useMarketData } from "hooks/borrow/useMarketData";
import { usePositionInfo } from "hooks/borrow/usePositionInfo";
import { useAmount } from "hooks/useAmount";
import Skeleton from "react-loading-skeleton";
import { useParams } from "react-router";
import { type Hash, isHash } from "viem";

const BorrowMarketDetailsLoaded = function ({
  market,
  marketId,
}: {
  market: MarketData;
  marketId: Hash;
}) {
  const { data: position } = usePositionInfo(marketId);

  const [borrowInput, onBorrowChange] = useAmount();
  const [collateralInput, onCollateralChange] = useAmount();

  const hasExistingPosition =
    position !== undefined &&
    (position.collateral > 0n || position.borrowAssets > 0n);

  return (
    <div className="flex flex-col">
      <MarketHeader
        collateralToken={market.collateralToken}
        loanToken={market.loanToken}
      />
      <div className="flex flex-col-reverse md:flex-row">
        <div className="flex-1 bg-gray-100">
          <MarketInfoCards market={market} marketId={market.marketId} />
        </div>
        <div className="bg-gray-100 md:hidden">
          <StripedDivider />
        </div>
        <div className="flex w-full flex-col md:w-[341px] md:border-b md:border-l md:border-gray-200">
          {hasExistingPosition ? (
            <ExistingPositionNotice />
          ) : (
            <BorrowForm
              borrowInput={borrowInput}
              collateralInput={collateralInput}
              market={market}
              marketId={marketId}
              onBorrowChange={onBorrowChange}
              onCollateralChange={onCollateralChange}
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

  return <BorrowMarketDetailsLoaded market={market} marketId={marketId} />;
};

export const BorrowMarketDetails = function () {
  const { marketId } = useParams<{ marketId: Hash }>();

  if (!marketId || !isHash(marketId)) {
    // TODO: Implement 404 page https://github.com/vetro-protocol/vetro-monorepo/issues/146
    return <div>Invalid Market Id</div>;
  }

  return <BorrowMarketDetailsContent marketId={marketId} />;
};
