import { useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { getVetroApiUrl, isValidUrl } from "utils/url";
import type { Hash } from "viem";

const apiUrl = getVetroApiUrl();

export const marketCollateralQueryKey = (marketId: Hash) => [
  "market-collateral",
  marketId,
];

export const useMarketCollateral = (marketId: Hash) =>
  useQuery({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () =>
      fetch(`${apiUrl}/borrow/${marketId}/collateral-assets`).then(
        ({ collateralAssets }: { collateralAssets: number }) =>
          BigInt(collateralAssets),
      ),
    queryKey: marketCollateralQueryKey(marketId),
  });
