import { checksumAddress } from "viem";

import { type Subgraph } from "../env.ts";
import { paginateHasuraQuery } from "../paginate-hasura-query.ts";

type RequestStatus =
  "CANCELLED" | "FINALIZED" | "FULFILLED" | "PENDING" | "RECOVERED";

type RequestRow = {
  amountIn: string;
  amountOut: string | null;
  asset: `0x${string}`;
  automatic: boolean | null;
  cancellationRequested: boolean;
  claimableAt: string | null;
  claimTxHash: string | null;
  failed: boolean;
  failureReason: string | null;
  kind: "DEPOSIT" | "REDEEM";
  processedAt: string | null;
  processTxHash: string | null;
  receivedAt: string | null;
  receiver: `0x${string}`;
  recoverTxHash: string | null;
  requestedAt: string;
  requestId: string;
  requestTxHash: string;
  retryCount: number;
  status: RequestStatus;
};

const toRequest = (row: RequestRow) => ({
  ...row,
  asset: checksumAddress(row.asset),
  automatic: row.automatic ?? true,
  receiver: checksumAddress(row.receiver),
  // The indexer keeps `failed` after a cancel or a recover. A terminal status
  // wins, so only a pending request shows as FAILED.
  status:
    row.failed && row.status === "PENDING" ? ("FAILED" as const) : row.status,
});

/**
 * Get the Hemi Earn requests (deposits and redeems) that the address
 * initiated, newest first.
 */
export async function getRequests({
  address,
  indexer,
}: {
  address: string;
  indexer: Subgraph;
}) {
  const rows = await paginateHasuraQuery<RequestRow>({
    ...indexer,
    field: "Request",
    query: `
      query GetEarnRequests($initiator: String!, $limit: Int!, $offset: Int!) {
        Request(
          where: { initiator: { _eq: $initiator } }
          order_by: { requestedAt: desc }
          limit: $limit
          offset: $offset
        ) {
          amountIn
          amountOut
          asset
          automatic
          cancellationRequested
          claimableAt
          claimTxHash
          failed
          failureReason
          kind
          processedAt
          processTxHash
          receivedAt
          receiver
          recoverTxHash
          requestedAt
          requestId
          requestTxHash
          retryCount
          status
        }
      }`,
    variables: { initiator: address.toLowerCase() },
  });
  return rows.map(toRequest);
}
