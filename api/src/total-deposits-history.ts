import { type Address } from "viem";
import { totalAssets } from "viem-erc4626/actions";

import { appendLivePoint } from "./append-live-point.ts";
import { createMainnetClient } from "./mainnet-client.ts";
import { paginateSubgraphQuery } from "./paginate-subgraph-query.ts";
import { getPeriodStart } from "./vault-history-period.ts";

type Row = { timestamp: string; totalAssets: string };

/**
 * Read the vault's current ERC4626 totalAssets live from the chain and return
 * it as a synthetic "now" point. The subgraph only writes a VaultHistory entry
 * once per UTC day, so its latest point can lag actual TVL by up to ~24h; this
 * live point keeps the series' last value in sync with the on-chain balance.
 * Returns null (so the caller falls back to the subgraph series alone) if the
 * read fails, keeping the endpoint as available as a subgraph-only read.
 */
async function getLiveTotalDepositsPoint({
  rpcUrl,
  stakingVaultAddress,
}: {
  rpcUrl: string | undefined;
  stakingVaultAddress: Address;
}) {
  try {
    const client = createMainnetClient(rpcUrl);
    const liveTotalAssets = await totalAssets(client, {
      address: stakingVaultAddress,
    });
    return { timestamp: Date.now(), totalDeposits: liveTotalAssets.toString() };
  } catch (error) {
    console.warn(
      `Failed to read live totalAssets for ${stakingVaultAddress}: ${error.message}`,
    );
    return null;
  }
}

/**
 * Query the subgraph for the total deposits (ERC4626 totalAssets, i.e. the
 * vault's underlying pegged token balance) history of a staking vault over the
 * given period. Paginates over the subgraph's 100-result page cap so that long
 * windows (e.g. "1y", up to ~366 daily entries) are returned in full. A live
 * on-chain totalAssets read is appended as the final point so the latest value
 * reflects current TVL rather than the last daily subgraph snapshot, via
 * `appendLivePoint` so it never duplicates the current UTC day's subgraph point.
 */
export async function getTotalDepositsHistory({
  period,
  rpcUrl,
  stakingVaultAddress,
  url,
}: {
  period: string;
  rpcUrl: string | undefined;
  stakingVaultAddress: Address;
  url: string;
}) {
  const stakingVault = stakingVaultAddress.toLowerCase();
  const start = getPeriodStart(period);
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
        timestamp
        totalAssets
      }
    }`;

  // The subgraph pagination and the live read are independent, so run them
  // concurrently rather than awaiting the history first.
  const [all, livePoint] = await Promise.all([
    paginateSubgraphQuery<Row>({
      cursor: {
        getValue: (row) => row.timestamp,
        variable: "start",
      },
      field: "vaultHistories",
      query,
      url,
      variables: { stakingVault, start },
    }),
    getLiveTotalDepositsPoint({ rpcUrl, stakingVaultAddress }),
  ]);

  const history = all.map((h) => ({
    timestamp: Number.parseInt(h.timestamp, 10) * 1000,
    totalDeposits: h.totalAssets,
  }));

  return appendLivePoint({
    getValue: (point) => point.totalDeposits,
    history,
    livePoint,
  });
}
