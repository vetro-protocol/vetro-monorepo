import type { Market } from "@morpho-org/blue-sdk";
import type { Token } from "types";
import {
  calculateDailyInterestCost,
  calculateHealthFactor,
  calculateLiquidationPrice,
  calculateLtv,
  formatLtvAsPercentage,
} from "utils/borrowReview";
import { getTokenPrice } from "utils/token";
import { parseUnits } from "viem";

import { useTokenPrices } from "../useTokenPrices";

type ReviewValues = {
  dailyInterestCost: number | null;
  healthFactor: number | null;
  liquidationPrice: number | null;
  lltv: number | null;
  ltv: number | null;
};

type Params = {
  borrowApy: number;
  borrowInput: string;
  collateralInput: string;
  collateralToken: Token;
  loanToken: Token;
  morphoMarket: Market | undefined;
};

const nullReview: ReviewValues = {
  dailyInterestCost: null,
  healthFactor: null,
  liquidationPrice: null,
  lltv: null,
  ltv: null,
};

export const useBorrowReview = function ({
  borrowApy,
  borrowInput,
  collateralInput,
  collateralToken,
  loanToken,
  morphoMarket,
}: Params): ReviewValues {
  const { data: prices } = useTokenPrices();

  if (!morphoMarket) {
    return nullReview;
  }

  const borrowAmount = parseFloat(borrowInput);
  const collateralAmount = parseFloat(collateralInput);

  if (
    !borrowAmount ||
    !collateralAmount ||
    isNaN(borrowAmount) ||
    isNaN(collateralAmount)
  ) {
    return nullReview;
  }

  const borrowAssets = parseUnits(borrowInput, loanToken.decimals);
  const collateral = parseUnits(collateralInput, collateralToken.decimals);
  const borrowShares = morphoMarket.toBorrowShares(borrowAssets);

  const position = { borrowShares, collateral };

  const loanUsdPrice = prices
    ? parseFloat(getTokenPrice(loanToken, prices))
    : 0;

  return {
    dailyInterestCost: calculateDailyInterestCost({ borrowAmount, borrowApy }),
    healthFactor: calculateHealthFactor({ morphoMarket, position }),
    liquidationPrice: calculateLiquidationPrice({
      collateralTokenDecimals: collateralToken.decimals,
      loanTokenDecimals: loanToken.decimals,
      loanUsdPrice,
      morphoMarket,
      position,
    }),
    lltv: formatLtvAsPercentage(morphoMarket.params.lltv),
    ltv: calculateLtv({ morphoMarket, position }),
  };
};
