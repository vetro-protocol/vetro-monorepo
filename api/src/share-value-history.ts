import { type Address, formatUnits } from "viem";
import { decimals } from "viem-erc20/actions";
import { asset, convertToAssets } from "viem-erc4626/actions";

import { createMainnetClient } from "./mainnet-client.ts";
import { paginateSubgraphQuery } from "./paginate-subgraph-query.ts";
import { getPeriodStart } from "./vault-history-period.ts";

type Row = { shareValue: string; timestamp: string };

type Client = ReturnType<typeof createMainnetClient>;

/**
 * Read the vault's current share value live from the chain: the assets returned
 * for one whole share (10^shareDecimals), in the asset's base units. The
 * subgraph only writes a VaultHistory entry once per UTC day, so its latest
 * point can lag the actual share value by up to ~24h; appending a live point
 * keeps the series' last value in sync with the on-chain rate. Returns null (so
 * the caller falls back to the subgraph series alone) if the read fails — which
 * also covers the empty vault case, where convertToAssets reverts on zero total
 * supply. The caller scales the returned value by the asset decimals.
 */
async function getLiveShareValue({
  client,
  stakingVaultAddress,
}: {
  client: Client;
  stakingVaultAddress: Address;
}) {
  try {
    const shareDecimals = await decimals(client, {
      address: stakingVaultAddress,
    });
    return await convertToAssets(client, {
      address: stakingVaultAddress,
      // one whole share
      shares: 10n ** BigInt(shareDecimals),
    });
  } catch (error) {
    console.warn(
      `Failed to read live share value for ${stakingVaultAddress}: ${error.message}`,
    );
    return null;
  }
}

/**
 * Read the decimals of the vault's underlying asset. convertToAssets returns a
 * value denominated in that asset, so both the subgraph's stored share values
 * and the live read are scaled by these decimals to a human-readable rate.
 */
async function getAssetDecimals({
  client,
  stakingVaultAddress,
}: {
  client: Client;
  stakingVaultAddress: Address;
}) {
  const assetAddress = await asset(client, { address: stakingVaultAddress });
  return decimals(client, { address: assetAddress });
}

/**
 * Query the subgraph for the share value history of a staking vault over the
 * given period. Paginates over the subgraph's 100-result page cap so that long
 * windows (e.g. "1y", up to ~366 daily entries) are returned in full. A live
 * on-chain share value read is appended as the final point so the latest value
 * reflects the current exchange rate rather than the last daily snapshot.
 */
export async function getShareValueHistory({
  period,
  rpcUrl,
  stakingVaultAddress,
  url,
}: {
  period: string;
  rpcUrl: string | undefined;
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

  const client = createMainnetClient(rpcUrl);

  // The subgraph pagination, the asset-decimals read, and the live share-value
  // read are independent, so run them concurrently rather than in sequence.
  const [all, assetDecimals, liveShareValue] = await Promise.all([
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
    getAssetDecimals({ client, stakingVaultAddress }),
    getLiveShareValue({ client, stakingVaultAddress }),
  ]);

  const history = all.map((h) => ({
    shareValue: Number(formatUnits(BigInt(h.shareValue), assetDecimals)),
    timestamp: Number.parseInt(h.timestamp, 10) * 1000,
  }));

  const livePoint =
    liveShareValue === null
      ? null
      : {
          shareValue: Number(formatUnits(liveShareValue, assetDecimals)),
          timestamp: Date.now(),
        };

  return livePoint ? [...history, livePoint] : history;
}
