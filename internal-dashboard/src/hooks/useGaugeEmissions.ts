import { queryOptions, useQuery } from "@tanstack/react-query";
import { type Address } from "viem";

import { fetchGaugeEmissions } from "../fetchers/fetchGaugeEmissions";

// The gauge payload is large, so it lives behind its own query (the summary view
// never needs it) and stays under a single cache entry — pool detail views
// select their gauge from it client-side instead of refetching per pool.
const gaugeEmissionsOptions = () =>
  queryOptions({
    queryFn: fetchGaugeEmissions,
    queryKey: ["gauge-emissions"],
    staleTime: 60 * 1000,
  });

export const useGaugeEmissions = ({
  poolAddress,
}: {
  poolAddress: Address | undefined;
}) =>
  useQuery({
    ...gaugeEmissionsOptions(),
    enabled: !!poolAddress,
    select: (emissions) =>
      poolAddress ? emissions[poolAddress.toLowerCase()] : undefined,
  });
