import { useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";
import type { Hash } from "viem";

export const aprHistoryPeriods = ["1w", "1m", "3m", "1y"] as const;
export type AprHistoryPeriod = (typeof aprHistoryPeriods)[number];

export type AprHistoryEntry = {
  apr: number;
  timestamp: number;
};

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const useAprHistory = (marketId: Hash, period: AprHistoryPeriod) =>
  useQuery({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () =>
      fetch(`${apiUrl}/borrow/${marketId}/apr-history/${period}`).then(
        (data: AprHistoryEntry[]) =>
          data.map((entry) => ({
            x: entry.timestamp,
            y: entry.apr * 100,
          })),
      ),
    queryKey: ["apr-history", marketId, period],
    staleTime: 5 * 60 * 1000,
  });
