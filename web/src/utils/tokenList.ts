import type { Token } from "types";
import { mainnet } from "viem/chains";

export const knownTokens: Token[] = [
  {
    address: "0x06ea695B91700071B161A434fED42D1DcbAD9f00",
    chainId: mainnet.id,
    decimals: 8,
    extensions: {
      balanceSlot: 5,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/hemibtc.svg",
    name: "Hemi Bitcoin",
    symbol: "hemiBTC",
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    chainId: mainnet.id,
    decimals: 6,
    extensions: {
      allowanceSlot: 10n,
      balanceSlot: 9,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/usdc.svg",
    name: "USD Coin",
    symbol: "USDC",
  },
  {
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    chainId: mainnet.id,
    decimals: 8,
    extensions: {
      allowanceSlot: 2n,
      balanceSlot: 0,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/wbtc.svg",
    name: "Wrapped BTC",
    symbol: "WBTC",
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    chainId: mainnet.id,
    decimals: 6,
    extensions: {
      allowanceSlot: 5n,
      balanceSlot: 2,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/usdt.svg",
    name: "Tether USD",
    symbol: "USDT",
  },
  {
    address: "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3",
    chainId: mainnet.id,
    decimals: 18,
    extensions: {
      balanceSlot: 0,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/vusd.svg",
    name: "Vetro USD",
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
