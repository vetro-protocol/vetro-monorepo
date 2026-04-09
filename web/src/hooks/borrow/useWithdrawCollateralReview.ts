import type { AccrualPosition } from "@morpho-org/blue-sdk";
import type { Token } from "types";
import { maxBigInt } from "utils/bigint";

import { usePositionReview } from "./usePositionReview";

type Params = {
  borrowApy: number;
  collateralInput: string;
  collateralToken: Token;
  frozen?: boolean;
  loanToken: Token;
  position: AccrualPosition | undefined;
};

export const useWithdrawCollateralReview = ({
  borrowApy,
  collateralInput,
  collateralToken,
  frozen,
  loanToken,
  position,
}: Params) =>
  usePositionReview({
    borrowApy,
    collateralToken,
    frozen,
    getUpdatedPosition(pos, amount) {
      const updatedCollateral = pos.collateral - amount;
      return {
        borrowShares: pos.borrowShares,
        collateral: maxBigInt(updatedCollateral, 0n),
      };
    },
    input: collateralInput,
    inputToken: collateralToken,
    loanToken,
    position,
  });
