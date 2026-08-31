import type { Token } from "@vetro-protocol/core";
import { ChainLogo } from "components/chainLogo";
import { TokenLogo } from "components/tokenLogo";
import { getChainById } from "networks";
import type { ComponentProps } from "react";

export type TokenChainLogoSize = ComponentProps<typeof ChainLogo>["size"];

type Props = {
  size?: TokenChainLogoSize;
  token: Token;
};

export const TokenChainLogo = function ({ size, token }: Props) {
  const chain = getChainById(token.chainId);
  return (
    <div className="relative pr-1 pb-1">
      <TokenLogo logoURI={token.logoURI} size={size} symbol={token.symbol} />
      <div className="absolute right-0 bottom-0">
        <ChainLogo chain={chain} size={size} />
      </div>
    </div>
  );
};
