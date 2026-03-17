import type { AccrualPosition } from "@morpho-org/blue-sdk";
import type { Token } from "types";
import { maxBigInt } from "utils/bigint";

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
          maxBigInt(updatedBorrowAssets, 0n),
        ),
        collateral: pos.collateral,
      };
    },
    input: repayInput,
    inputToken: loanToken,
    loanToken,
    position,
  });
