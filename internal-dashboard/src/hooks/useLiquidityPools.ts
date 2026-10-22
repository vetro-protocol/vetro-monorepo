import { queryOptions, useQuery } from "@tanstack/react-query";
import { type DexPool } from "@vetro-protocol/core";
import fetch from "fetch-plus-plus";

import { toDashboardPools } from "../lib/dashboardPools";

// Overridable per environment (see .env / .env.local), like web's VITE_VETRO_API_URL.
const apiUrl = import.meta.env.VITE_VETRO_API_URL;

// Mapped in the queryFn, not in a select, so the fetchers that read the pools
// through ensureQueryData (campaigns) get the derived ids too.
export const liquidityPoolsOptions = () =>
  queryOptions({
    queryFn: () =>
      fetch(`${apiUrl}/liquidity/pools`, {
        queryString: { includeLowTvl: true, includeRanges: true },
      }).then((pools: DexPool[]) => toDashboardPools(pools)),
    queryKey: ["liquidity-pools"],
    staleTime: 2 * 60 * 1000,
  });

export const useLiquidityPools = () => useQuery(liquidityPoolsOptions());
