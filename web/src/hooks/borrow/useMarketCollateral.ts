import { useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";
import type { Hash } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const marketCollateralQueryKey = (marketId: Hash) => [
  "market-collateral",
  marketId,
];

export const useMarketCollateral = (marketId: Hash) =>
  useQuery({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () =>
      fetch(`${apiUrl}/borrow/${marketId}/collateral-assets`).then(
        (data: number) => BigInt(data),
      ),
    queryKey: marketCollateralQueryKey(marketId),
  });
