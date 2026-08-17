import type { Address } from "viem";

import type { Gateway } from "./types.ts";

// A hand-maintained copy of the protocol graph on Ethereum mainnet, for
// faster rendering times skipping initial reading for on-chain values.
export const gateways: Gateway[] = [
  {
    // VUSD gateway
    address: "0xDaD503f8B9d42bb7af3AfC588358D30163e4416F",
    pegBaseSymbol: "USD",
    // VUSD
    peggedToken: "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3",
    // sVUSD
    stakingVault: "0x476310E34D2810f7d79C43A74E4D79405bd7a925",
    treasury: "0xC8317A10385BE07901A4c9ee3d06E1D83AE378c9",
    whitelistedTokens: [
      // USDT
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      // USDC
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      // frxUSD
      "0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29",
    ],
  },
  {
    // vetBTC gateway
    address: "0xCBA2Ffa0AC52d7871a4221a871793Eb788013faB",
    pegBaseSymbol: "BTC",
    // vetBTC
    peggedToken: "0xf196C68233464A16CFDa319a47c21f4cECa62001",
    // svetBTC
    stakingVault: "0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e",
    treasury: "0xd25a7b0b817fD816d0995eC67fb70e75EE65Bd7F",
    whitelistedTokens: [
      // WBTC
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      // cbBTC
      "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      // hemiBTC
      "0x06ea695B91700071B161A434fED42D1DcbAD9f00",
    ],
  },
];

export const gatewayAddresses: Address[] = gateways.map(
  (gateway) => gateway.address,
);
