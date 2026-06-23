import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/earn";
import type { Token } from "types";
import { arbitrum, base, bsc, hemi, mainnet, optimism } from "viem/chains";

export const knownTokens: Token[] = [
  {
    address: "0x06ea695B91700071B161A434fED42D1DcbAD9f00",
    chainId: mainnet.id,
    decimals: 8,
    extensions: {
      allowanceSlot: 6n,
      balanceSlot: 5,
      priceSymbol: "BTC",
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
    address: "0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29",
    chainId: mainnet.id,
    decimals: 18,
    extensions: {
      allowanceSlot: 1n,
      balanceSlot: 0,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/frxusd.svg",
    name: "Frax USD",
    symbol: "frxUSD",
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
      priceSymbol: "USDT",
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/vetrousd.svg",
    name: "Vetro USD",
    symbol: "VUSD",
  },
  {
    address: "0xCE2c108fB49551f6d27BBb529Ad1938835ac3574",
    chainId: arbitrum.id,
    decimals: 18,
    extensions: {
      priceSymbol: "USDT",
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/vetrousd.svg",
    name: "Vetro USD",
    symbol: "VUSD",
  },
  {
    address: "0x8a654093e21703afc8d038FF253A3c974C5C2957",
    chainId: base.id,
    decimals: 18,
    extensions: {
      priceSymbol: "USDT",
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/vetrousd.svg",
    name: "Vetro USD",
    symbol: "VUSD",
  },
  {
    address: "0x10061d0593441Ff74536158592e1Be3F4C7B180C",
    chainId: bsc.id,
    decimals: 18,
    extensions: {
      priceSymbol: "USDT",
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/vetrousd.svg",
    name: "Vetro USD",
    symbol: "VUSD",
  },
  {
    address: "0xD3599AE62EE280709A22268a46d23164214e345B",
    chainId: hemi.id,
    decimals: 18,
    extensions: {
      priceSymbol: "USDT",
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/vetrousd.svg",
    name: "Vetro USD",
    symbol: "VUSD",
  },
  {
    address: "0xb591169E6508983CC6618738cC73c9F09c38dE14",
    chainId: optimism.id,
    decimals: 18,
    extensions: {
      priceSymbol: "USDT",
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/vetrousd.svg",
    name: "Vetro USD",
    symbol: "VUSD",
  },
  {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    chainId: mainnet.id,
    decimals: 18,
    extensions: {
      allowanceSlot: 4n,
      balanceSlot: 3,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/weth.svg",
    name: "Wrapped Ether",
    symbol: "WETH",
  },
  {
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    chainId: mainnet.id,
    decimals: 8,
    extensions: {
      allowanceSlot: 10n,
      balanceSlot: 9,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/cbbtc.svg",
    name: "Coinbase Wrapped BTC",
    symbol: "cbBTC",
  },
  {
    address: "0xf196C68233464A16CFDa319a47c21f4cECa62001",
    chainId: mainnet.id,
    decimals: 18,
    extensions: {
      allowanceSlot: 1n,
      balanceSlot: 0,
      priceSymbol: "WBTC",
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/vetbtc.svg",
    name: "Vetro BTC",
    symbol: "vetBTC",
  },
  {
    address: sVetBtcAddress,
    chainId: mainnet.id,
    decimals: 18,
    extensions: {
      isVaultShare: true,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/svetbtc.svg",
    name: "Staked Vetro BTC",
    symbol: "svetBTC",
  },
  {
    address: sVusdAddress,
    chainId: mainnet.id,
    decimals: 18,
    extensions: {
      // The sVUSD vault is an OZ 5.x upgradeable contract, which stores ERC20
      // state in an ERC-7201 namespace ("openzeppelin.storage.ERC20") instead
      // of at small sequential slots. Inside that struct, _balances is at
      // offset 0 and _allowances at offset 1, so the slot below is
      // `ERC20StorageLocation + 1` (see `ERC20Upgradeable.sol` in
      // @openzeppelin/contracts-upgradeable v5).
      allowanceSlot:
        0x52c63247e1f47db19d5ce0460030c497f067ca4cebf71ba98eeadabe20bace01n,
      isVaultShare: true,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/svusd.svg",
    name: "Staked Vetro USD",
    symbol: "sVUSD",
  },
  {
    address: "0x50c580227764b621c0433bB6Ab756C781c495ce7",
    chainId: arbitrum.id,
    decimals: 18,
    extensions: {
      allowanceSlot: 6n,
      isVaultShare: true,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/svusd.svg",
    name: "Staked Vetro USD",
    symbol: "sVUSD",
  },
  {
    address: "0xb174750002068862Dfe7DF38F974a950F189386a",
    chainId: base.id,
    decimals: 18,
    extensions: {
      allowanceSlot: 6n,
      isVaultShare: true,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/svusd.svg",
    name: "Staked Vetro USD",
    symbol: "sVUSD",
  },
  {
    address: "0xC141B66eE4262Ba46Ea29578955C274fD4A96515",
    chainId: bsc.id,
    decimals: 18,
    extensions: {
      allowanceSlot: 6n,
      isVaultShare: true,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/svusd.svg",
    name: "Staked Vetro USD",
    symbol: "sVUSD",
  },
  {
    address: "0xfe875CC86cC6BC2E93ab330D6b2c408C3Cd79710",
    chainId: hemi.id,
    decimals: 18,
    extensions: {
      allowanceSlot: 6n,
      isVaultShare: true,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/svusd.svg",
    name: "Staked Vetro USD",
    symbol: "sVUSD",
  },
  {
    address: "0x92273Ca3356379C2fe870FE3805cc5e7aB6d19c6",
    chainId: optimism.id,
    decimals: 18,
    extensions: {
      allowanceSlot: 6n,
      isVaultShare: true,
    },
    logoURI: "https://hemilabs.github.io/token-list/l1Logos/svusd.svg",
    name: "Staked Vetro USD",
    symbol: "sVUSD",
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
