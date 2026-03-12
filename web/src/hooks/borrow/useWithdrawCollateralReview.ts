import type { AccrualPosition } from "@morpho-org/blue-sdk";
import type { Token } from "types";

import { usePositionReview } from "./usePositionReview";

type Params = {
  borrowApy: number;
  collateralInput: string;
  collateralToken: Token;
  loanToken: Token;
  position: AccrualPosition | undefined;
};

export const useWithdrawCollateralReview = ({
  borrowApy,
  collateralInput,
  collateralToken,
  loanToken,
  position,
}: Params) =>
  usePositionReview({
    borrowApy,
    collateralToken,
    getUpdatedPosition: (pos, amount) => ({
      borrowShares: pos.borrowShares,
      collateral: pos.collateral - amount,
    }),
    input: collateralInput,
    inputDecimals: collateralToken.decimals,
    loanToken,
    position,
  });
