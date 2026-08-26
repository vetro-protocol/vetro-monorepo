import { type Address, isAddressEqual } from "viem";

import { trackedChains } from "../config/chains";

import { type TrackedPool, type TrackedToken } from "./types";

export type PoolFilterState = {
  campaignsOnly: boolean;
  chainIds: number[];
  trackedSymbols: string[];
  whitelistedTokens: Address[];
};

export const emptyPoolFilters: PoolFilterState = {
  campaignsOnly: false,
  chainIds: [],
  trackedSymbols: [],
  whitelistedTokens: [],
};

export const hasActiveFilters = (filters: PoolFilterState) =>
  filters.campaignsOnly ||
  filters.chainIds.length > 0 ||
  filters.trackedSymbols.length > 0 ||
  filters.whitelistedTokens.length > 0;

const holdsToken = ({
  address,
  pool,
}: {
  address: Address;
  pool: TrackedPool;
}) => pool.coins.some((coin) => isAddressEqual(coin.address, address));

const holdsSymbol = ({ pool, symbol }: { pool: TrackedPool; symbol: string }) =>
  pool.coins.some((coin) => coin.symbol === symbol);

// A pool matches a dropdown when any of its selections match, and it must match
// every dropdown that has a selection. An empty dropdown filters nothing.
const matchesAny = <T>({
  matches,
  selected,
}: {
  matches: (value: T) => boolean;
  selected: T[];
}) => selected.length === 0 || selected.some(matches);

export const chainFilterOptions = (pools: TrackedPool[]) =>
  trackedChains
    .filter((chain) => pools.some((pool) => pool.chainId === chain.id))
    .map((chain) => ({ label: chain.name, value: chain.id }));

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

export const trackedSymbolOptions = ({
  pools,
  tokens,
}: {
  pools: TrackedPool[];
  tokens: TrackedToken[];
}) =>
  [...new Set(tokens.map((token) => token.symbol))]
    .filter((symbol) => pools.some((pool) => holdsSymbol({ pool, symbol })))
    .map((symbol) => ({ label: symbol, value: symbol }))
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
      matchesAny({
        matches: (chainId) => pool.chainId === chainId,
        selected: filters.chainIds,
      }) &&
      matchesAny({
        matches: (symbol) => holdsSymbol({ pool, symbol }),
        selected: filters.trackedSymbols,
      }) &&
      matchesAny({
        matches: (address) => holdsToken({ address, pool }),
        selected: filters.whitelistedTokens,
      }) &&
      (!filters.campaignsOnly || campaignPoolIds.includes(pool.id)),
  );
