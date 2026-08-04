import { useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import type { Hash } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const marketCollateralQueryKey = (marketId: Hash) => [
  "market-collateral",
  marketId,
];

export const useMarketCollateral = (marketId: Hash) =>
  useQuery({
    enabled: apiUrl !== undefined && URL.canParse(apiUrl),
    queryFn: () =>
      fetch(`${apiUrl}/borrow/${marketId}/collateral-assets`).then(
        ({ collateralAssets }: { collateralAssets: number }) =>
          BigInt(collateralAssets),
      ),
    queryKey: marketCollateralQueryKey(marketId),
  });
