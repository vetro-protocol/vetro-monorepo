import { type Address } from "viem";

// Sushi has no rich public API like Curve's, so the pools we track are curated
// here by address. Everything else — the two tokens, their decimals/symbols, and
// the fee — is read on-chain from the pool (see fetchers/fetchSushiPools), and
// the USD-reference leg is inferred from the tracked-token set at fetch time, so
// no token identities are hardcoded.
export type SushiPoolConfig = {
  address: Address;
  // Price bands (in token1 per token0, i.e. quote per base, matching the pool's
  // on-chain token order) to additionally list as concentrated views, showing
  // how much liquidity sits within each band.
  ranges?: { lowerPrice: number; upperPrice: number }[];
};

export const sushiPools: SushiPoolConfig[] = [
  {
    // VUSD/USDT
    address: "0x6c2bd2f9711f204e595d334c6b7b672851b7d699",
    ranges: [{ lowerPrice: 0.96, upperPrice: 1.04 }],
  },
];
