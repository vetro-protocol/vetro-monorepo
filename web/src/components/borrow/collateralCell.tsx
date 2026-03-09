import { useMarketCollateral } from "hooks/borrow/useMarketCollateral";
import type { Token } from "types";
import type { Hash } from "viem";

import { TokenValueCell } from "./tokenValueCell";

type Props = {
  marketId: Hash;
  token: Token;
};

export function CollateralCell({ marketId, token }: Props) {
  const { data: value, status } = useMarketCollateral(marketId);

  return <TokenValueCell status={status} token={token} value={value} />;
}
