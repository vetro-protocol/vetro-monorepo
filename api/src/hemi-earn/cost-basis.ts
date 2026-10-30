import { checksumAddress, formatUnits } from "viem";

import { type Subgraph } from "../env.ts";
import * as graphql from "../graphql.ts";
import { paginateHasuraQuery } from "../paginate-hasura-query.ts";

import {
  type CostBasisEvent,
  type RatePoint,
  replayCostBasis,
  WAD_DECIMALS,
} from "./replay.ts";
import { createHemiClient, resolveShareByAsset } from "./router.ts";

type RequestRow = {
  amountIn: string | null;
  amountOut: string | null;
  asset: string;
  kind: "DEPOSIT" | "REDEEM";
  processedAt: string | null;
  requestedAt: string | null;
  stakedAmount: string | null;
};

type ShareTransferRow = {
  from: string;
  share: string;
  timestamp: string;
  to: string;
  value: string;
};

type RateSnapshotRow = {
  rateDenominator: string;
  rateNumerator: string;
  timestamp: string;
};

type TimedEvent = { event: CostBasisEvent; timestamp: bigint };

const getRequestRows = ({
  indexer,
  receiver,
}: {
  indexer: Subgraph;
  receiver: string;
}) =>
  paginateHasuraQuery<RequestRow>({
    ...indexer,
    field: "Request",
    query: `
      query GetEarnCostBasis($limit: Int!, $offset: Int!, $receiver: String!) {
        Request(
          where: {
            receiver: { _eq: $receiver }
            _or: [
              { processedAt: { _is_null: false } }
              { kind: { _eq: "REDEEM" }, status: { _eq: "PENDING" } }
            ]
          }
          order_by: [{ processedAt: asc }, { requestId: asc }]
          limit: $limit
          offset: $offset
        ) {
          amountIn
          amountOut
          asset
          kind
          processedAt
          requestedAt
          stakedAmount
        }
      }`,
    variables: { receiver },
  });

const getShareTransferRows = ({
  account,
  indexer,
}: {
  account: string;
  indexer: Subgraph;
}) =>
  paginateHasuraQuery<ShareTransferRow>({
    ...indexer,
    field: "ShareTransfer",
    query: `
      query GetShareTransfers($account: String!, $limit: Int!, $offset: Int!) {
        ShareTransfer(
          where: { _or: [{ from: { _eq: $account } }, { to: { _eq: $account } }] }
          order_by: [{ blockNumber: asc }, { logIndex: asc }]
          limit: $limit
          offset: $offset
        ) {
          from
          share
          timestamp
          to
          value
        }
      }`,
    variables: { account },
  });

async function getEarnAssets(indexer: Subgraph) {
  const { RateSnapshot } = await graphql.runQuery<{
    RateSnapshot: { asset: string }[];
  }>({
    ...indexer,
    query: `
      query GetEarnAssets {
        RateSnapshot(distinct_on: asset, order_by: { asset: asc }) { asset }
      }`,
  });
  return RateSnapshot.map((row) => row.asset.toLowerCase());
}

async function fetchRateBound({
  asset,
  comparator,
  indexer,
  order,
  timestamp,
}: {
  asset: string;
  comparator: "_gte" | "_lte";
  indexer: Subgraph;
  order: "asc" | "desc";
  timestamp: string;
}) {
  const { RateSnapshot } = await graphql.runQuery<{
    RateSnapshot: RateSnapshotRow[];
  }>({
    ...indexer,
    query: `
      query GetRateBound($asset: String!, $timestamp: numeric!) {
        RateSnapshot(
          where: { asset: { _eq: $asset }, timestamp: { ${comparator}: $timestamp } }
          order_by: { timestamp: ${order} }
          limit: 1
        ) {
          rateDenominator
          rateNumerator
          timestamp
        }
      }`,
    variables: { asset, timestamp },
  });
  return RateSnapshot[0] ?? null;
}

const toRatePoint = (row: RateSnapshotRow): RatePoint => ({
  denominator: row.rateDenominator,
  numerator: row.rateNumerator,
});

// The rate snapshot nearest in time to the transfer, before or after it,
// approximates the vault's convertToAssets at that moment.
async function getNearestRate({
  asset,
  indexer,
  timestamp,
}: {
  asset: string;
  indexer: Subgraph;
  timestamp: string;
}) {
  const [below, above] = await Promise.all([
    fetchRateBound({
      asset,
      comparator: "_lte",
      indexer,
      order: "desc",
      timestamp,
    }),
    fetchRateBound({
      asset,
      comparator: "_gte",
      indexer,
      order: "asc",
      timestamp,
    }),
  ]);
  if (!below) {
    return above ? toRatePoint(above) : null;
  }
  if (!above) {
    return toRatePoint(below);
  }
  const target = BigInt(timestamp);
  const closest =
    target - BigInt(below.timestamp) <= BigInt(above.timestamp) - target
      ? below
      : above;
  return toRatePoint(closest);
}

function requestToEvent({
  row,
  shareByAsset,
}: {
  row: RequestRow;
  shareByAsset: Record<string, string>;
}): TimedEvent | null {
  const share = shareByAsset[row.asset.toLowerCase()];
  if (!share) {
    return null;
  }
  // A deposit gets its shares when the vault mints them, but a redeem gives
  // its shares to the Router when the request is sent.
  if (row.kind === "DEPOSIT") {
    if (row.amountOut === null || row.processedAt === null) {
      return null;
    }
    return {
      event: {
        kind: "DEPOSIT",
        share,
        shares: row.amountOut,
        staked: row.stakedAmount,
      },
      timestamp: BigInt(row.processedAt),
    };
  }
  const requestedAt = row.requestedAt ?? row.processedAt;
  if (row.amountIn === null || requestedAt === null) {
    return null;
  }
  return {
    event: { kind: "REDEEM", share, shares: row.amountIn },
    timestamp: BigInt(requestedAt),
  };
}

async function transferToEvent({
  account,
  assetByShare,
  indexer,
  row,
}: {
  account: string;
  assetByShare: Record<string, string>;
  indexer: Subgraph;
  row: ShareTransferRow;
}): Promise<TimedEvent | null> {
  const from = row.from.toLowerCase();
  const share = row.share.toLowerCase();
  const to = row.to.toLowerCase();
  const timestamp = BigInt(row.timestamp);
  if (to === account && from !== account) {
    const asset = assetByShare[share];
    const rate = asset
      ? await getNearestRate({ asset, indexer, timestamp: row.timestamp })
      : null;
    return {
      event: { kind: "TRANSFER_IN", rate, share, value: row.value },
      timestamp,
    };
  }
  if (from === account && to !== account) {
    return {
      event: { kind: "TRANSFER_OUT", share, value: row.value },
      timestamp,
    };
  }
  return null;
}

async function resolveShares({
  assets,
  rpcUrl,
}: {
  assets: string[];
  rpcUrl: string | undefined;
}) {
  const client = createHemiClient(rpcUrl);
  const resolved = await Promise.all(
    [...new Set(assets)].map((asset) =>
      resolveShareByAsset({ asset, client }).then(
        (share) => [asset, share] as const,
      ),
    ),
  );
  return Object.fromEntries(
    resolved.filter(
      (entry): entry is readonly [string, string] => entry[1] !== null,
    ),
  );
}

/**
 * Get the cost basis of each Hemi Earn share token that the address holds.
 * It replays the processed deposits and redeems of the address (as receiver)
 * and its share transfers, oldest first. A transfer in is priced at the
 * nearest share-to-asset rate. The values are decimal strings in the pegged
 * token's base units, keyed by the checksummed share token address.
 */
export async function getCostBasis({
  address,
  indexer,
  rpcUrl,
}: {
  address: string;
  indexer: Subgraph;
  rpcUrl: string | undefined;
}) {
  const account = address.toLowerCase();

  const [requestRows, transferRows] = await Promise.all([
    getRequestRows({ indexer, receiver: account }),
    getShareTransferRows({ account, indexer }),
  ]);

  // Only a transfer needs the assets of other holders, to map its share back
  // to an asset for pricing.
  const globalAssets =
    transferRows.length > 0 ? await getEarnAssets(indexer) : [];
  const shareByAsset = await resolveShares({
    assets: [
      ...requestRows.map((row) => row.asset.toLowerCase()),
      ...globalAssets,
    ],
    rpcUrl,
  });
  const assetByShare = Object.fromEntries(
    Object.entries(shareByAsset).map(([asset, share]) => [share, asset]),
  );

  const timedEvents = (
    await Promise.all([
      ...requestRows.map((row) => requestToEvent({ row, shareByAsset })),
      ...transferRows.map((row) =>
        transferToEvent({ account, assetByShare, indexer, row }),
      ),
    ])
  ).filter((entry) => entry !== null);

  // The sort is stable, so on a tie a request stays before a transfer.
  timedEvents.sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0,
  );

  const positions = replayCostBasis(timedEvents.map((entry) => entry.event));

  return Object.fromEntries(
    [...positions]
      .filter(([, { shares }]) => shares > 0n)
      .map(([share, { costBasis }]) => [
        checksumAddress(share),
        formatUnits(costBasis, WAD_DECIMALS),
      ]),
  );
}
