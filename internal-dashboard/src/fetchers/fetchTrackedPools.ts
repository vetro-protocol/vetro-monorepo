import {
  type DexPool,
  type DexRewardToken,
  knownTokens,
} from "@vetro-protocol/core";
import { isAddressEqual } from "viem";
import { hemi, mainnet } from "viem/chains";
import { symbol } from "viem-erc20/actions";

import { client, hemiClient } from "../lib/client";
import { shortenAddress } from "../lib/format";
import { toTrackedPool } from "../lib/trackedPool";

const clients = { [hemi.id]: hemiClient, [mainnet.id]: client };

const tokenKey = ({ address, chainId }: DexRewardToken) =>
  `${chainId}-${address.toLowerCase()}`;

const fetchSymbol = async function (token: DexRewardToken) {
  const known = knownTokens.find(
    (candidate) =>
      candidate.chainId === token.chainId &&
      isAddressEqual(candidate.address, token.address),
  );
  if (known) {
    return known.symbol;
  }
  const chainClient = clients[token.chainId as keyof typeof clients];
  return chainClient
    ? symbol(chainClient, { address: token.address }).catch(() =>
        shortenAddress(token.address),
      )
    : shortenAddress(token.address);
};

const poolTokens = (pool: DexPool) => [
  ...pool.coins.map((coin) => ({
    address: coin.address,
    chainId: pool.chainId,
  })),
  ...pool.rewards.flatMap((reward) => reward.tokens),
];

export const fetchTrackedPools = async function () {
  // fetch-plus-plus needs Node's http.Agent for http:// URLs, such as the dev
  // proxy, so this uses the native fetch.
  const response = await fetch(
    `${import.meta.env.VITE_VETRO_API_URL}/liquidity/pools?includeLowTvl=true&includeRanges=true`,
  );
  if (!response.ok) {
    throw new Error(`Failed to get the DEX pools: ${response.status}`);
  }
  const pools: DexPool[] = await response.json();

  const tokens = [
    ...new Map(
      pools.flatMap(poolTokens).map((token) => [tokenKey(token), token]),
    ).values(),
  ];
  const symbols = new Map(
    await Promise.all(
      tokens.map(
        async (token) => [tokenKey(token), await fetchSymbol(token)] as const,
      ),
    ),
  );
  const symbolOf = (token: DexRewardToken) => symbols.get(tokenKey(token))!;

  const rangedAddresses = pools
    .filter((pool) => pool.range !== undefined)
    .map((pool) => pool.address);

  return pools.map((pool) =>
    toTrackedPool({
      hasRangeRows:
        pool.range === undefined &&
        rangedAddresses.some((address) =>
          isAddressEqual(address, pool.address),
        ),
      pool,
      symbolOf,
    }),
  );
};
