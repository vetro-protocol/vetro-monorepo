import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchPoolCampaigns } from "../fetchers/fetchPoolCampaigns";
import { type PoolCampaign } from "../lib/types";

const poolCampaignsOptions = () =>
  queryOptions({
    queryFn: ({ client: queryClient }) => fetchPoolCampaigns(queryClient),
    queryKey: ["pool-campaigns"],
    refetchInterval: 60 * 1000,
    staleTime: 60 * 1000,
  });

const selectCampaignPoolIds = (campaigns: Record<string, PoolCampaign[]>) =>
  Object.keys(campaigns).filter((poolId) => campaigns[poolId].length > 0);

export const usePoolCampaigns = ({ poolId }: { poolId: string }) =>
  useQuery({
    ...poolCampaignsOptions(),
    select: (campaigns) => campaigns[poolId] ?? [],
  });

export const useCampaignPoolIds = () =>
  useQuery({ ...poolCampaignsOptions(), select: selectCampaignPoolIds });
