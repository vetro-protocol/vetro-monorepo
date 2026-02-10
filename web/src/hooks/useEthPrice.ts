import { useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";

const apiUrl = import.meta.env.VITE_PORTAL_API_URL;

type PricesResponse = {
  prices: Record<string, string>;
  time: string;
};

function parseEthPrice(data: PricesResponse) {
  const ethPriceRaw = data?.prices?.ETH;
  const ethPrice =
    typeof ethPriceRaw === "string" ? parseFloat(ethPriceRaw) : NaN;

  if (!Number.isFinite(ethPrice)) {
    throw new Error("Invalid ETH price received from API");
  }

  return ethPrice;
}

export const useEthPrice = () =>
  useQuery({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () => fetch(`${apiUrl}/prices`).then(parseEthPrice),
    queryKey: ["eth-price"],
    refetchInterval: 60 * 1000, // 1 minute
    retry: 2,
    staleTime: 30 * 1000, // 30 seconds
  });
