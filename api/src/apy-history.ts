import type { Context } from "hono";
import { type Address } from "viem";

import { appendLivePoint } from "./append-live-point.ts";
import { aprWadToApy } from "./apr-wad-to-apy.ts";
import { paginateSubgraphQuery } from "./paginate-subgraph-query.ts";
import { getPeriodStart } from "./vault-history-period.ts";
import { readWarmedTask } from "./warm-cache.ts";
import { apyTask } from "./warm-tasks.ts";

type Row = { apr: string; timestamp: string };

/**
 * The vault's current APY as a synthetic "now" point, read from the warmed
 * `variable-stake:apy` cache — `readWarmedTask` serves the pre-computed value and,
 * on a KV miss, falls back to computing it on demand and writes through. The subgraph
 * only writes a VaultAprHistory entry once per UTC day, so its latest point can lag the
 * actual APY by up to ~24h; appending this live point keeps the series' last value in
 * sync with the current rate. Returns null — so the caller falls back to the subgraph
 * series alone — when the vault is absent from the cached record (its on-chain reads
 * failed) or the warmed read itself fails, keeping the endpoint as available as a
 * subgraph-only read.
 */
async function getLiveApyPoint({
  c,
  stakingVaultAddress,
}: {
  c: Context<{ Bindings: Env }>;
  stakingVaultAddress: Address;
}) {
  try {
    const apyByVault = await readWarmedTask({ c, task: apyTask });
    const apy = apyByVault?.[stakingVaultAddress]?.apy;
    return apy === undefined ? null : { apy, timestamp: Date.now() };
  } catch (error) {
    // A KV read (or fallback compute) failure must not fail the whole endpoint:
    // drop the live point and let the caller serve the subgraph-only series.
    console.warn(
      `Failed to read live APY for ${stakingVaultAddress}: ${error.message}`,
    );
    return null;
  }
}

/**
 * Query the subgraph for the APY history of a staking vault over the given period.
 * The subgraph stores the daily-maximum APR (WAD-scaled); each point is converted to
 * a continuous-compounding APY percentage with the same formula the live endpoint
 * uses, so historic and current values stay consistent. Paginates over the subgraph's
 * 100-result page cap so long windows (e.g. "1y", up to ~366 daily entries) are
 * returned in full. A live APY point (from the warmed cache, see `getLiveApyPoint`) is
 * appended as the final point so the latest value reflects the current rate rather than
 * the last daily snapshot, unless the subgraph already has a point for the current UTC
 * day: then the live point is skipped when the APY matches, or replaces that day's point
 * when it differs, so the series never has two points on the same day.
 */
export async function getApyHistory({
  c,
  period,
  stakingVaultAddress,
  url,
}: {
  c: Context<{ Bindings: Env }>;
  period: string;
  stakingVaultAddress: Address;
  url: string;
}): Promise<{ apy: number; timestamp: number }[]> {
  const stakingVault = stakingVaultAddress.toLowerCase();
  const start = getPeriodStart(period);
  const query = `
    query ($first: Int!, $skip: Int!, $stakingVault: Bytes!, $start: BigInt!) {
      vaultAprHistories(
        first: $first
        orderBy: timestamp
        orderDirection: asc
        skip: $skip
        where: {
          stakingVaultAddress: $stakingVault
          timestamp_gte: $start
        }
      ) {
        apr
        timestamp
      }
    }`;

  // The subgraph pagination and the warmed live APY read are independent, so run
  // them concurrently rather than in sequence.
  const [all, livePoint] = await Promise.all([
    paginateSubgraphQuery<Row>({
      cursor: {
        getValue: (row) => row.timestamp,
        variable: "start",
      },
      field: "vaultAprHistories",
      query,
      url,
      variables: { stakingVault, start },
    }),
    getLiveApyPoint({ c, stakingVaultAddress }),
  ]);

  const history = all.map((h) => ({
    apy: aprWadToApy(BigInt(h.apr)),
    timestamp: Number.parseInt(h.timestamp, 10) * 1000,
  }));

  return appendLivePoint({
    getValue: (point) => point.apy,
    history,
    livePoint,
  });
}
