import type { AccrualPosition } from "@morpho-org/blue-sdk";
import type { Token } from "types";

import { usePositionReview } from "./usePositionReview";

type Params = {
  borrowApy: number;
  collateralInput: string;
  collateralToken: Token;
  frozen?: boolean;
  loanToken: Token;
  position: AccrualPosition | undefined;
};

export const useSupplyCollateralReview = ({
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
    getUpdatedPosition: (pos, amount) => ({
      borrowShares: pos.borrowShares,
      collateral: pos.collateral + amount,
    }),
    input: collateralInput,
    inputToken: collateralToken,
    loanToken,
    position,
  });
