import { type Address } from "viem";

export const brownfiSubgraphUrl = "/api/brownfi";

export const brownfiPoolUrl = (address: Address) =>
  `https://app.brownfi.io/clamm/analytics/pools/${address.toLowerCase()}`;
