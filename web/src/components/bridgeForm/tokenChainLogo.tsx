import { ChainLogo } from "components/chainLogo";
import { TokenLogo } from "components/tokenLogo";
import { allChains } from "networks";
import type { ComponentProps } from "react";
import type { Token } from "types";

type Props = {
  size?: ComponentProps<typeof TokenLogo>["size"];
  token: Token;
};

export const TokenChainLogo = function ({ size, token }: Props) {
  const chain = allChains.find((c) => c.id === token.chainId);
  return (
    <div className="relative">
      <TokenLogo logoURI={token.logoURI} size={size} symbol={token.symbol} />
      {chain && (
        <div className="absolute -right-1 -bottom-1">
          <ChainLogo chain={chain} size={size} />
        </div>
      )}
    </div>
  );
};
