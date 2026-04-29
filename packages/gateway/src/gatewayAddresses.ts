import type { Address } from "viem";

export type Gateway = {
  address: Address;
  // Portal-API symbol used to convert this gateway's peg unit into USD.
  // "USD" is treated as identity (no conversion needed).
  pegBaseSymbol: string;
};

// Whitelisted-token oracles within a gateway are denominated in the gateway's
// peg unit (e.g. WBTC/BTC for the vetBTC gateway, USDT/USD for the VUSD gateway),
// so the USD price for any whitelisted token is `oracle × portal[pegBaseSymbol]`.
// See `web/src/hooks/usePrices.ts` for the merge.
export const gateways: Gateway[] = [
  // VUSD
  {
    address: "0xDaD503f8B9d42bb7af3AfC588358D30163e4416F",
    pegBaseSymbol: "USD",
  },
  // vetBTC
  {
    address: "0xCBA2Ffa0AC52d7871a4221a871793Eb788013faB",
    pegBaseSymbol: "BTC",
  },
];

export const gatewayAddresses: Address[] = gateways.map((g) => g.address);
