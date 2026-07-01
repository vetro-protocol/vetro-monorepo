import { PoolsTable } from "../components/dex/poolsTable";
import { StateMessage } from "../components/dex/stateMessage";
import { TokenDistribution } from "../components/dex/tokenDistribution";
import { useTrackedPools } from "../hooks/useTrackedPools";

export const DexPage = function () {
  const { data: pools, isError, isPending } = useTrackedPools();

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
              <PoolsTable
                pools={[...pools].sort((a, b) => b.tvlUsd - a.tvlUsd)}
              />
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
