import { isAddressEqual } from "viem";

import { type TrackedPool, type TrackedToken } from "./types";

// Fixed-point scale for the bigint share ratio: 6 decimals of share precision,
// well beyond the 2 decimals of percentage the UI renders.
const SHARE_SCALE = 1_000_000n;

type DistributionSlice = {
  balance: bigint; // raw on-chain units
  pool: TrackedPool;
  share: number; // 0..1 of the token's total tracked liquidity
};

export type TokenDistribution = {
  slices: DistributionSlice[];
  token: TrackedToken;
  totalBalance: bigint; // raw on-chain units
};

// For each token, how its tracked-pool liquidity is split across the pools that
// hold it. Tokens that appear in a single pool produce a one-slice
// distribution, which the UI renders as a plain stat rather than a chart.
export const computeDistributions = ({
  pools,
  tokens,
}: {
  pools: TrackedPool[];
  tokens: TrackedToken[];
}): TokenDistribution[] =>
  tokens.map(function (token) {
    const entries = pools
      .map(function (pool) {
        const coin = pool.coins.find((candidate) =>
          isAddressEqual(candidate.address, token.address),
        );
        return coin ? { balance: coin.balance, pool } : undefined;
      })
      .filter(Boolean);

    const totalBalance = entries.reduce(
      (sum, entry) => sum + entry.balance,
      0n,
    );

    // Same token across pools shares decimals, so the raw-unit ratio is the
    // share. The ratio is computed in fixed-point bigint to stay exact for raw
    // balances above 2^53, then converted to a number only for display.
    const slices = entries
      .map((entry) => ({
        ...entry,
        share:
          totalBalance > 0n
            ? Number((entry.balance * SHARE_SCALE) / totalBalance) /
              Number(SHARE_SCALE)
            : 0,
      }))
      .sort((a, b) =>
        a.balance < b.balance ? 1 : a.balance > b.balance ? -1 : 0,
      );

    return { slices, token, totalBalance };
  });
