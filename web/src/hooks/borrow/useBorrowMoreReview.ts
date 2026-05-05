import type { AccrualPosition } from "@morpho-org/blue-sdk";
import type { Token } from "types";

import { usePositionReview } from "./usePositionReview";

type Params = {
  borrowApy: number;
  borrowInput: string;
  collateralToken: Token;
  frozen?: boolean;
  loanToken: Token;
  position: AccrualPosition | undefined;
};

export const useBorrowMoreReview = ({
  borrowApy,
  borrowInput,
  collateralToken,
  frozen,
  loanToken,
  position,
}: Params) =>
  usePositionReview({
    borrowApy,
    collateralToken,
    frozen,
    getUpdatedPosition: (pos, amount) => ({
      borrowShares: pos.market.toBorrowShares(
        pos.market.toBorrowAssets(pos.borrowShares) + amount,
      ),
      collateral: pos.collateral,
    }),
    input: borrowInput,
    inputToken: loanToken,
    loanToken,
    position,
  });
