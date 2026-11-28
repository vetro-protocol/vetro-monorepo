import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchLiveVersion, isUpdateAvailable } from "utils/buildVersion";

const checkIntervalMs = 30 * 60 * 1000;
const runningVersion = import.meta.env.VITE_BUILD_VERSION;

const isUpdateFound = (liveVersion: string | null | undefined) =>
  isUpdateAvailable({ liveVersion, runningVersion });

const liveVersionOptions = () =>
  queryOptions({
    queryFn: fetchLiveVersion,
    queryKey: ["live-version"],
    refetchInterval: (query) =>
      isUpdateFound(query.state.data) ? false : checkIntervalMs,
    refetchOnWindowFocus: (query) => !isUpdateFound(query.state.data),
    staleTime: 0,
  });

export const useLiveVersion = () => useQuery(liveVersionOptions());
