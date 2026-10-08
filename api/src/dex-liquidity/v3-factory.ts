import { gateways } from "@vetro-protocol/core";
import { type Address, type Client, isAddressEqual, zeroAddress } from "viem";
import { multicall } from "viem/actions";

import { trackedTokenAddresses } from "./tracked-tokens.ts";

const feeTiers = [100, 500, 3000, 10000];

const factoryAbi = [
  {
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" },
    ],
    name: "getPool",
    outputs: [{ name: "pool", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

type PoolQuery = { fee: number; token0: Address; token1: Address };

export type V3Pool = PoolQuery & { address: Address };

const whitelistedTokenAddresses = gateways.flatMap(
  (gateway) => gateway.whitelistedTokens,
);

const buildPoolQueries = () =>
  trackedTokenAddresses.flatMap((tracked, index) =>
    [
      ...trackedTokenAddresses.slice(index + 1),
      ...whitelistedTokenAddresses,
    ].flatMap(function (other): PoolQuery[] {
      const [token0, token1] =
        tracked.toLowerCase() < other.toLowerCase()
          ? [tracked, other]
          : [other, tracked];
      return feeTiers.map((fee) => ({ fee, token0, token1 }));
    }),
  );

export async function findV3Pools({
  client,
  factoryAddress,
}: {
  client: Client;
  factoryAddress: Address;
}): Promise<V3Pool[]> {
  const queries = buildPoolQueries();
  const addresses = await multicall(client, {
    allowFailure: false,
    batchSize: 0,
    contracts: queries.map((query) => ({
      abi: factoryAbi,
      address: factoryAddress,
      args: [query.token0, query.token1, query.fee],
      functionName: "getPool",
    })),
  });
  return queries
    .map((query, index) => ({ ...query, address: addresses[index] }))
    .filter((pool) => !isAddressEqual(pool.address, zeroAddress));
}
