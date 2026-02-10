import { useQuery } from "@tanstack/react-query";
import type { Token } from "types";
import { mainnet } from "viem/chains";

const whitelistedTokens: Token[] = [
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    chainId: mainnet.id,
    decimals: 6,
    extensions: {
      allowanceSlot: 10n,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/usdc.svg",
    name: "USD Coin",
    symbol: "USDC",
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    chainId: mainnet.id,
    decimals: 6,
    extensions: {
      allowanceSlot: 5n,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/usdt.svg",
    name: "Tether USD",
    symbol: "USDT",
  },
];

export const useWhitelistedTokens = () =>
  useQuery({
    initialData: whitelistedTokens,
    // TODO validate token list from treasury - see https://github.com/vetro-protocol/vetro-monorepo/issues/34
    queryFn: () => whitelistedTokens,
    queryKey: ["whitelisted-tokens"],
    staleTime: Infinity,
  });
