import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchShareTokenRates } from "../fetchers/fetchShareTokenRates";

export const shareTokenRatesOptions = () =>
  queryOptions({
    queryFn: ({ client: queryClient }) => fetchShareTokenRates({ queryClient }),
    queryKey: ["share-token-rates"],
    staleTime: 60 * 1000,
  });

export const useShareTokenRates = ({ enabled }: { enabled: boolean }) =>
  useQuery({ ...shareTokenRatesOptions(), enabled });
