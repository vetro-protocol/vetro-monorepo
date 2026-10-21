import { knownTokens } from "@vetro-protocol/core";
import { isAddressEqual } from "viem";

import { type DashboardPool, type TrackedToken } from "./types";

type DistributionSlice = {
  amount: number; // token units
  pool: DashboardPool;
  share: number; // 0..1 of the token's total tracked liquidity
};

export type TokenDistribution = {
  slices: DistributionSlice[];
  token: TrackedToken;
  totalAmount: number; // token units
};

// For each token, how its tracked-pool liquidity is split across the pools that
// hold it. Tokens that appear in a single pool produce a one-slice
// distribution, which the UI renders as a plain stat rather than a chart.
export const computeDistributions = ({
  pools,
  tokens,
}: {
  pools: DashboardPool[];
  tokens: TrackedToken[];
}): TokenDistribution[] =>
  tokens.map(function (token) {
    const addresses = [
      token.address,
      ...knownTokens
        .filter((known) => known.symbol === token.symbol)
        .map((known) => known.address),
    ];

    const entries = pools
      .map(function (pool) {
        const coin = pool.coins.find((candidate) =>
          addresses.some((address) =>
            isAddressEqual(address, candidate.address),
          ),
        );
        return coin ? { amount: coin.amount, pool } : undefined;
      })
      .filter(Boolean);

    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

    const slices = entries
      .map((entry) => ({
        ...entry,
        share: totalAmount > 0 ? entry.amount / totalAmount : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { slices, token, totalAmount };
  });
