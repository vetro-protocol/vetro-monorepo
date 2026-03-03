import { RenderFiatValue } from "components/base/fiatValue";
import { useMarketCollateral } from "hooks/borrow/useMarketCollateral";
import type { Token } from "types";
import type { Hash } from "viem";

type Props = {
  marketId: Hash;
  token: Token;
};

export function CollateralCell({ marketId, token }: Props) {
  const { data: value, status } = useMarketCollateral(marketId);

  return (
    <span className="text-b-medium text-gray-900">
      <RenderFiatValue queryStatus={status} token={token} value={value} />
    </span>
  );
}
