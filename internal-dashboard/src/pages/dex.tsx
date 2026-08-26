import { useState } from "react";

import { PoolFilters } from "../components/dex/poolFilters";
import { PoolsTable } from "../components/dex/poolsTable";
import { StateMessage } from "../components/dex/stateMessage";
import { TokenDistribution } from "../components/dex/tokenDistribution";
import { useCampaignPoolIds } from "../hooks/usePoolCampaigns";
import { useTrackedPools } from "../hooks/useTrackedPools";
import { useTrackedTokens } from "../hooks/useTrackedTokens";
import { useWhitelistedTokens } from "../hooks/useWhitelistedTokens";
import {
  chainFilterOptions,
  emptyPoolFilters,
  filterPools,
  tokenFilterOptions,
  trackedSymbolOptions,
} from "../lib/poolFilters";

export const DexPage = function () {
  const { data: pools, isError, isPending } = useTrackedPools();
  const { data: trackedTokens, error: trackedTokensError } = useTrackedTokens();
  const { data: whitelistedTokens, error: whitelistedTokensError } =
    useWhitelistedTokens();
  const { data: campaignPoolIds, error: campaignsError } = useCampaignPoolIds();
  const [filters, setFilters] = useState(emptyPoolFilters);

  const filtersError = [
    trackedTokensError,
    whitelistedTokensError,
    campaignsError,
  ].find(Boolean);

  const filteredPools = filterPools({
    campaignPoolIds: campaignPoolIds ?? [],
    filters,
    pools: pools ?? [],
  }).sort((a, b) => b.tvlUsd - a.tvlUsd);

  return (
    <section className="flex flex-col gap-y-10">
      <header>
        <h2 className="text-2xl font-semibold text-neutral-950">DEX</h2>
        <p className="mt-1 text-sm font-medium text-neutral-600">
          DEX liquidity across tracked Vetro pools.
        </p>
      </header>

      {isPending ? <StateMessage>Loading pools…</StateMessage> : null}
      {isError ? (
        <StateMessage>
          Couldn&apos;t load pool data. Try again later.
        </StateMessage>
      ) : null}

      {pools ? (
        pools.length === 0 ? (
          <StateMessage>No tracked pools found.</StateMessage>
        ) : (
          <>
            <div>
              <h3 className="mb-3 text-lg font-semibold text-neutral-950">
                Pools
              </h3>
              <PoolFilters
                campaignsDisabled={campaignPoolIds === undefined}
                chainOptions={chainFilterOptions(pools)}
                error={filtersError}
                filters={filters}
                onChange={setFilters}
                trackedSymbolOptions={trackedSymbolOptions({
                  pools,
                  tokens: trackedTokens ?? [],
                })}
                whitelistedTokenOptions={tokenFilterOptions({
                  pools,
                  tokens: whitelistedTokens ?? [],
                })}
              />
              {filteredPools.length === 0 ? (
                <StateMessage>No pool matches the filters.</StateMessage>
              ) : (
                <PoolsTable pools={filteredPools} />
              )}
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold text-neutral-950">
                Stats
              </h3>
              <p className="mb-4 text-sm text-neutral-600">
                Share of each token&apos;s tracked liquidity by pool.
              </p>
              <TokenDistribution
                // Exclude concentrated range views so a pool's liquidity isn't
                // counted twice (the full entry already covers it).
                pools={pools.filter((pool) => !pool.isRangeView)}
              />
            </div>
          </>
        )
      ) : null}
    </section>
  );
};
