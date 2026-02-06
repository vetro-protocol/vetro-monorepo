import { useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type ApyResponse = {
  "7d": number;
};

export const useApy = () =>
  useQuery({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () =>
      fetch(`${apiUrl}/variable-stake/apy`).then(
        (data: ApyResponse) => data["7d"],
      ),
    queryKey: ["variable-stake-apy"],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
