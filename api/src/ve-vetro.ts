import { type Address, checksumAddress, type Hash } from "viem";

import { type Subgraph } from "./env.ts";
import * as graphql from "./graphql.ts";

type ClaimRow = {
  amount: string;
  blockTimestamp: string;
  claimant: Address;
  position: { id: string };
  recipient: Address;
  transactionHash: Hash;
  veHemiPositions: { id: string }[];
};

type PositionRow = {
  amount: string;
  id: string;
  status: "active" | "withdrawn";
  transferableAfter: string;
  unlockTime: string;
};

// graph-node's maximum for `first`. An address is not expected to get close.
const maxResults = 1000;

const byTokenId = (a: string, b: string) =>
  BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0;

const toClaim = (row: ClaimRow) => ({
  amount: row.amount,
  claimant: checksumAddress(row.claimant),
  positionTokenId: row.position.id,
  recipient: checksumAddress(row.recipient),
  timestamp: Number(row.blockTimestamp),
  transactionHash: row.transactionHash,
  veHemiTokenIds: row.veHemiPositions.map(({ id }) => id).sort(byTokenId),
});

const toPosition = ({
  nowSeconds,
  row,
}: {
  nowSeconds: number;
  row: PositionRow;
}) => ({
  amount: row.amount,
  status: row.status,
  tokenId: row.id,
  transferable: Number(row.transferableAfter) <= nowSeconds,
  unlockTime: Number(row.unlockTime),
});

/**
 * Get the veVETRO claims the address made and the veVETRO positions it owns,
 * newest first, with the block the subgraph has indexed up to.
 */
export async function getVeVetro({
  address,
  subgraph,
}: {
  address: string;
  subgraph: Subgraph;
}) {
  // A single query, so `_meta` describes the same indexer state as the rows.
  const query = `
    query ($address: Bytes!, $first: Int!) {
      _meta {
        block {
          number
        }
      }
      claims(
        first: $first
        orderBy: blockNumber
        orderDirection: desc
        where: { claimant: $address }
      ) {
        amount
        blockTimestamp
        claimant
        position {
          id
        }
        recipient
        transactionHash
        veHemiPositions(first: $first) {
          id
        }
      }
      veVetroPositions(
        first: $first
        orderBy: blockNumber
        orderDirection: desc
        where: { owner: $address }
      ) {
        amount
        id
        status
        transferableAfter
        unlockTime
      }
    }`;
  const variables = { address: address.toLowerCase(), first: maxResults };
  const {
    _meta: meta,
    claims,
    veVetroPositions,
  } = await graphql.runQuery<{
    _meta: { block: { number: number } };
    claims: ClaimRow[];
    veVetroPositions: PositionRow[];
  }>({ ...subgraph, query, variables });
  if (!Array.isArray(claims) || !Array.isArray(veVetroPositions)) {
    throw new Error(`Invalid subgraph response for veVETRO of ${address}`);
  }
  if (claims.length === maxResults || veVetroPositions.length === maxResults) {
    console.warn(
      `Got ${maxResults} veVETRO claims or positions for ${address}. Implement pagination!`,
    );
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    claims: claims.map(toClaim),
    indexedBlock: meta.block.number,
    positions: veVetroPositions.map((row) => toPosition({ nowSeconds, row })),
  };
}
