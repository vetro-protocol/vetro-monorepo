import { useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type AnalyticsTotals = {
  vusdMinted: string;
  vusdStaked: string;
};

export const useAnalyticsTotals = () =>
  useQuery({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () =>
      fetch(`${apiUrl}/analytics/totals`) as Promise<AnalyticsTotals>,
    queryKey: ["analytics-totals"],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
