import { type Address, formatUnits } from "viem";

import * as graphql from "./graphql.ts";

const secsPerDay = 86400;

/* eslint-disable sort-keys */
const periodToStartOffset: Record<string, number> = {
  "1w": 7 * secsPerDay,
  "1m": 30 * secsPerDay,
  "3m": 90 * secsPerDay,
  "1y": 366 * secsPerDay,
};
/* eslint-enable sort-keys */

export const validPeriods = Object.keys(periodToStartOffset);

const pageSize = 100;
// To prevent infinite loops in the case of a misbehaving subgraph, we set a hard cap
// but we shouldn't load more than 4 pages per year
const hardCap = 4 * pageSize;

type Row = { shareValue: string; timestamp: string };

/**
 * Query the subgraph for the share value history of a staking vault over the
 * given period. Paginates over the subgraph's 100-result page cap so that long
 * windows (e.g. "1y", up to ~366 daily entries) are returned in full. Stops
 * defensively at hardCap rows to bound the loop.
 */
export async function getShareValueHistory({
  period,
  stakingVaultAddress,
  url,
}: {
  period: string;
  stakingVaultAddress: Address;
  url: string;
}): Promise<{ shareValue: number; timestamp: number }[]> {
  const stakingVault = stakingVaultAddress.toLowerCase();
  const start = (
    Math.floor(Date.now() / 1000) - periodToStartOffset[period]
  ).toString();
  const query = `
    query ($first: Int!, $skip: Int!, $stakingVault: Bytes!, $start: BigInt!) {
      vaultHistories(
        first: $first
        orderBy: timestamp
        orderDirection: asc
        skip: $skip
        where: {
          stakingVaultAddress: $stakingVault
          timestamp_gte: $start
        }
      ) {
        shareValue
        timestamp
      }
    }`;

  const all: Row[] = [];
  let skip = 0;
  while (skip < hardCap) {
    const { vaultHistories } = await graphql.runQuery<{
      vaultHistories: Row[];
    }>(url, query, { first: pageSize, skip, stakingVault, start });
    if (!Array.isArray(vaultHistories)) {
      throw new Error(
        `Invalid subgraph response for vault history of ${stakingVaultAddress}`,
      );
    }
    all.push(...vaultHistories);
    if (vaultHistories.length < pageSize) break;
    skip += pageSize;
  }

  return all.map((h) => ({
    shareValue: Number(formatUnits(BigInt(h.shareValue), 18)),
    timestamp: Number.parseInt(h.timestamp, 10) * 1000,
  }));
}
