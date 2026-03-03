import type { Token } from "types";
import { mainnet } from "viem/chains";

export const knownTokens: Token[] = [
  {
    address: "0x06ea695B91700071B161A434fED42D1DcbAD9f00",
    chainId: mainnet.id,
    decimals: 8,
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/hemibtc.svg",
    name: "Hemi Bitcoin",
    symbol: "hemiBTC",
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    chainId: mainnet.id,
    decimals: 6,
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/usdc.svg",
    name: "USD Coin",
    symbol: "USDC",
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    chainId: mainnet.id,
    decimals: 6,
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/usdt.svg",
    name: "Tether USD",
    symbol: "USDT",
  },
  {
    address: "0xB94724aa74A0296447D13a63A35B050b7F137C6d",
    chainId: mainnet.id,
    decimals: 18,
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/vusd.svg",
    name: "VUSD",
    symbol: "VUSD",
  },
];

export const getTokenListParams = (tokens: Token[]) => ({
  allButLast: tokens
    .slice(0, -1)
    .map((t) => t.symbol)
    .join(", "),
  count: tokens.length,
  firstSymbol: tokens[0]?.symbol,
  lastSymbol: tokens.at(-1)?.symbol,
});
