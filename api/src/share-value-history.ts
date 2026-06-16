import { type Address, formatUnits } from "viem";

import { paginateSubgraphQuery } from "./paginate-subgraph-query.ts";
import { getPeriodStart } from "./vault-history-period.ts";

type Row = { shareValue: string; timestamp: string };

/**
 * Query the subgraph for the share value history of a staking vault over the
 * given period. Paginates over the subgraph's 100-result page cap so that long
 * windows (e.g. "1y", up to ~366 daily entries) are returned in full.
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
        shareValue
        timestamp
      }
    }`;

  const all = await paginateSubgraphQuery<Row>({
    cursor: {
      getValue: (row) => row.timestamp,
      variable: "start",
    },
    field: "vaultHistories",
    query,
    url,
    variables: { stakingVault, start },
  });

  return all.map((h) => ({
    shareValue: Number(formatUnits(BigInt(h.shareValue), 18)),
    timestamp: Number.parseInt(h.timestamp, 10) * 1000,
  }));
}
