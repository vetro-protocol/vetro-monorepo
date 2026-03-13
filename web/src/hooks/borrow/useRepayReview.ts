import type { AccrualPosition } from "@morpho-org/blue-sdk";
import type { Token } from "types";

import { usePositionReview } from "./usePositionReview";

type Params = {
  borrowApy: number;
  collateralToken: Token;
  loanToken: Token;
  position: AccrualPosition | undefined;
  repayInput: string;
};

export const useRepayReview = ({
  borrowApy,
  collateralToken,
  loanToken,
  position,
  repayInput,
}: Params) =>
  usePositionReview({
    borrowApy,
    collateralToken,
    getUpdatedPosition: (pos, amount) => ({
      borrowShares: pos.market.toBorrowShares(
        pos.market.toBorrowAssets(pos.borrowShares) - amount,
      ),
      collateral: pos.collateral,
    }),
    input: repayInput,
    inputToken: loanToken,
    loanToken,
    position,
  });
