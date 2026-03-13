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
    getUpdatedPosition(pos, amount) {
      const updatedBorrowAssets =
        pos.market.toBorrowAssets(pos.borrowShares) - amount;
      return {
        borrowShares: pos.market.toBorrowShares(
          updatedBorrowAssets < 0n ? 0n : updatedBorrowAssets,
        ),
        collateral: pos.collateral,
      };
    },
    input: repayInput,
    inputToken: loanToken,
    loanToken,
    position,
  });
