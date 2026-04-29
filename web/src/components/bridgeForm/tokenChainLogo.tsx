import { ChainLogo } from "components/chainLogo";
import { TokenLogo } from "components/tokenLogo";
import { allChains } from "networks";
import type { Token } from "types";

type Props = {
  token: Token;
};

export const TokenChainLogo = function ({ token }: Props) {
  const chain = allChains.find((c) => c.id === token.chainId);
  return (
    <div className="relative">
      <TokenLogo logoURI={token.logoURI} symbol={token.symbol} />
      {chain && (
        <div className="absolute -right-1 -bottom-1">
          <ChainLogo chain={chain} />
        </div>
      )}
    </div>
  );
};
