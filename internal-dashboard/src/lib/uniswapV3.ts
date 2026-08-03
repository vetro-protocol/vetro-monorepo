import { type Address, isAddressEqual, zeroAddress } from "viem";
import { multicall } from "viem/actions";

import { uniswapV3FactoryAddress, uniswapV3FeeTiers } from "../config/uniswap";

import { client } from "./client";

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

// A pool's tokens travel with the query, so a discovered pool already knows what
// it holds — no second lookup by address once the factory answers.
type PoolToken = { address: Address; decimals: number; symbol: string };

export type PoolQuery = { fee: number; token0: PoolToken; token1: PoolToken };

export const buildPoolQueries = function ({
  candidates,
  trackedAddresses,
}: {
  candidates: PoolToken[];
  trackedAddresses: Set<string>;
}): PoolQuery[] {
  const pairs = new Map(
    candidates
      .filter((candidate) =>
        trackedAddresses.has(candidate.address.toLowerCase()),
      )
      .flatMap((tracked) =>
        candidates
          .filter(
            (candidate) => !isAddressEqual(candidate.address, tracked.address),
          )
          .map(function (other) {
            const [token0, token1] =
              tracked.address.toLowerCase() < other.address.toLowerCase()
                ? [tracked, other]
                : [other, tracked];
            return [
              `${token0.address}-${token1.address}`.toLowerCase(),
              { token0, token1 },
            ];
          }),
      ),
  );

  return [...pairs.values()].flatMap((pair) =>
    uniswapV3FeeTiers.map((fee) => ({ ...pair, fee })),
  );
};

export const findPools = async function (queries: PoolQuery[]) {
  const addresses = await multicall(client, {
    allowFailure: false,
    batchSize: 0,
    contracts: queries.map((query) => ({
      abi: factoryAbi,
      address: uniswapV3FactoryAddress,
      args: [query.token0.address, query.token1.address, query.fee],
      functionName: "getPool",
    })),
  });

  return queries
    .map((query, index) => ({ ...query, address: addresses[index] }))
    .filter((pool) => !isAddressEqual(pool.address, zeroAddress));
};
