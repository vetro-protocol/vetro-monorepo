import { RenderCryptoValue } from "components/base/cryptoValue";
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
    <div className="flex flex-col gap-y-0.5">
      <span className="text-b-medium text-right text-gray-900">
        <RenderFiatValue queryStatus={status} token={token} value={value} />
      </span>
      <span className="text-caption text-gray-500 *:w-full">
        <RenderCryptoValue
          amountContainer={({ children }) => (
            <span className="block w-full text-right">{children}</span>
          )}
          container={({ children }) => (
            <span className="flex w-full gap-x-0.5">{children}</span>
          )}
          showSymbol
          status={status}
          token={token}
          value={value}
        />
      </span>
    </div>
  );
}
