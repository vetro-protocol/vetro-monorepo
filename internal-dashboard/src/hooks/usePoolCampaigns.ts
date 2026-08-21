import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchPoolCampaigns } from "../fetchers/fetchPoolCampaigns";

const poolCampaignsOptions = ({ poolId }: { poolId: string }) =>
  queryOptions({
    queryFn: ({ client: queryClient }) => fetchPoolCampaigns(queryClient),
    queryKey: ["pool-campaigns"],
    refetchInterval: 60 * 1000,
    select: (campaigns) => campaigns[poolId] ?? [],
    staleTime: 60 * 1000,
  });

export const usePoolCampaigns = ({ poolId }: { poolId: string }) =>
  useQuery(poolCampaignsOptions({ poolId }));
