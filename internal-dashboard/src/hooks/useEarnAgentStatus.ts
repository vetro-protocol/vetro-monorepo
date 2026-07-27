import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchEarnAgentStatus } from "../fetchers/fetchEarnAgentStatus";

const earnAgentStatusOptions = () =>
  queryOptions({
    queryFn: fetchEarnAgentStatus,
    queryKey: ["earn-agent-status"],
    refetchInterval: 60_000,
  });

export const useEarnAgentStatus = () => useQuery(earnAgentStatusOptions());
