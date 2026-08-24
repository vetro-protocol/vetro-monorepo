import { type Address, isAddressEqual } from "viem";

import { type TrackedPool, type TrackedToken } from "./types";

export type PoolFilterState = {
  campaignsOnly: boolean;
  trackedTokens: Address[];
  whitelistedTokens: Address[];
};

export const emptyPoolFilters: PoolFilterState = {
  campaignsOnly: false,
  trackedTokens: [],
  whitelistedTokens: [],
};

export const hasActiveFilters = (filters: PoolFilterState) =>
  filters.campaignsOnly ||
  filters.trackedTokens.length > 0 ||
  filters.whitelistedTokens.length > 0;

const holdsToken = ({
  address,
  pool,
}: {
  address: Address;
  pool: TrackedPool;
}) => pool.coins.some((coin) => isAddressEqual(coin.address, address));

// A pool matches a dropdown when it holds any of the selected tokens, and it must
// match every dropdown that has a selection. An empty dropdown filters nothing.
const matchesTokens = ({
  pool,
  selected,
}: {
  pool: TrackedPool;
  selected: Address[];
}) =>
  selected.length === 0 ||
  selected.some((address) => holdsToken({ address, pool }));

export const tokenFilterOptions = ({
  pools,
  tokens,
}: {
  pools: TrackedPool[];
  tokens: TrackedToken[];
}) =>
  tokens
    .filter(
      (token, index, all) =>
        all.findIndex((candidate) =>
          isAddressEqual(candidate.address, token.address),
        ) === index &&
        pools.some((pool) => holdsToken({ address: token.address, pool })),
    )
    .map((token) => ({ label: token.symbol, value: token.address }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const filterPools = ({
  campaignPoolIds,
  filters,
  pools,
}: {
  campaignPoolIds: string[];
  filters: PoolFilterState;
  pools: TrackedPool[];
}) =>
  pools.filter(
    (pool) =>
      matchesTokens({ pool, selected: filters.trackedTokens }) &&
      matchesTokens({ pool, selected: filters.whitelistedTokens }) &&
      (!filters.campaignsOnly || campaignPoolIds.includes(pool.id)),
  );
