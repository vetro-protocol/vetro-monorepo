import type { AccrualPosition, Market } from "@morpho-org/blue-sdk";
import type { Token } from "types";
import {
  calculateDailyInterestCost,
  calculateHealthFactor,
  calculateLiquidationPrice,
  calculateLtv,
} from "utils/borrowReview";
import { getTokenPrice } from "utils/token";
import { formatUnits, parseUnits } from "viem";

import { useTokenPrices } from "../useTokenPrices";

type Position = {
  borrowShares: bigint;
  collateral: bigint;
};

type PositionMetrics = {
  borrowAssets: bigint;
  collateral: bigint;
  dailyInterestCost: number | null;
  healthFactor: number | null;
  liquidationPrice: number | null;
  ltv: number | null;
};

const nullMetrics: PositionMetrics = {
  borrowAssets: 0n,
  collateral: 0n,
  dailyInterestCost: null,
  healthFactor: null,
  liquidationPrice: null,
  ltv: null,
};

type Params = {
  borrowApy: number;
  collateralInput: string;
  collateralToken: Token;
  loanToken: Token;
  position: AccrualPosition | undefined;
};

const buildMetrics = function ({
  borrowApy,
  collateralTokenDecimals,
  loanTokenDecimals,
  loanUsdPrice,
  morphoMarket,
  position,
}: {
  borrowApy: number;
  collateralTokenDecimals: number;
  loanTokenDecimals: number;
  loanUsdPrice: number;
  morphoMarket: Market;
  position: Position;
}): PositionMetrics {
  const borrowAssets = morphoMarket.toBorrowAssets(position.borrowShares);
  const borrowAmount = Number(formatUnits(borrowAssets, loanTokenDecimals));
  return {
    borrowAssets,
    collateral: position.collateral,
    dailyInterestCost: calculateDailyInterestCost({ borrowAmount, borrowApy }),
    healthFactor: calculateHealthFactor({ morphoMarket, position }),
    liquidationPrice: calculateLiquidationPrice({
      collateralTokenDecimals,
      loanTokenDecimals,
      loanUsdPrice,
      morphoMarket,
      position,
    }),
    ltv: calculateLtv({ morphoMarket, position }),
  };
};

export const useSupplyCollateralReview = function ({
  borrowApy,
  collateralInput,
  collateralToken,
  loanToken,
  position,
}: Params): { current: PositionMetrics; updated: PositionMetrics | null } {
  const { data: prices } = useTokenPrices();

  if (!position) {
    return { current: nullMetrics, updated: null };
  }

  const loanUsdPrice = prices
    ? parseFloat(getTokenPrice(loanToken, prices))
    : 0;

  const metricsParams = {
    borrowApy,
    collateralTokenDecimals: collateralToken.decimals,
    loanTokenDecimals: loanToken.decimals,
    loanUsdPrice,
    morphoMarket: position.market,
  };

  const current = buildMetrics({
    ...metricsParams,
    position: {
      borrowShares: position.borrowShares,
      collateral: position.collateral,
    },
  });

  const additionalCollateral = parseFloat(collateralInput);
  if (!additionalCollateral || isNaN(additionalCollateral)) {
    return { current, updated: null };
  }

  const additionalCollateralBigInt = parseUnits(
    collateralInput,
    collateralToken.decimals,
  );

  const updated = buildMetrics({
    ...metricsParams,
    position: {
      borrowShares: position.borrowShares,
      collateral: position.collateral + additionalCollateralBigInt,
    },
  });

  return { current, updated };
};
