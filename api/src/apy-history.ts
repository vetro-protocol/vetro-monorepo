import { type Address } from "viem";

import { appendLivePoint } from "./append-live-point.ts";
import { aprWadToApy } from "./apr-wad-to-apy.ts";
import { createMainnetClient } from "./mainnet-client.ts";
import { paginateSubgraphQuery } from "./paginate-subgraph-query.ts";
import { computeVaultApy } from "./variable-stake.ts";
import { getPeriodStart } from "./vault-history-period.ts";

type Row = { apr: string; timestamp: string };

/**
 * Read the vault's current APY live from the chain as a synthetic "now" point. The
 * subgraph only writes a VaultAprHistory entry once per UTC day, so its latest point
 * can lag the actual APY by up to ~24h; appending a live point keeps the series' last
 * value in sync with the current rate. Returns null (so the caller falls back to the
 * subgraph series alone) if the on-chain read fails, keeping the endpoint as available
 * as a subgraph-only read.
 */
async function getLiveApyPoint({
  rpcUrl,
  stakingVaultAddress,
}: {
  rpcUrl: string | undefined;
  stakingVaultAddress: Address;
}) {
  try {
    const client = createMainnetClient(rpcUrl);
    const apy = await computeVaultApy({
      client,
      vaultAddress: stakingVaultAddress,
    });
    return { apy, timestamp: Date.now() };
  } catch (error) {
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
 * returned in full. A live on-chain APY read is appended as the final point so the
 * latest value reflects the current rate rather than the last daily snapshot, unless
 * the subgraph already has a point for the current UTC day: then the live point is
 * skipped when the APY matches, or replaces that day's point when it differs, so the
 * series never has two points on the same day.
 */
export async function getApyHistory({
  period,
  rpcUrl,
  stakingVaultAddress,
  url,
}: {
  period: string;
  rpcUrl: string | undefined;
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

  // The subgraph pagination and the live APY read are independent, so run them
  // concurrently rather than in sequence.
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
    getLiveApyPoint({ rpcUrl, stakingVaultAddress }),
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
