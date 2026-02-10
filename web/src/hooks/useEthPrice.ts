import { useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";

const apiUrl = import.meta.env.VITE_PORTAL_API_URL;

type PricesResponse = {
  prices: Record<string, string>;
  time: string;
};

export const useEthPrice = () =>
  useQuery({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () =>
      fetch(`${apiUrl}/prices`).then((data: PricesResponse) =>
        parseFloat(data.prices.ETH),
      ),
    queryKey: ["eth-price"],
    refetchInterval: 60 * 1000, // 1 minute
    retry: 2,
    staleTime: 30 * 1000, // 30 seconds
  });
