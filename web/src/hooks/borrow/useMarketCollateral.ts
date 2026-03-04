import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Hash } from "viem";

const marketCollateralOptions = (marketId: Hash) =>
  queryOptions({
    async queryFn() {
      const response = await fetch("https://api.morpho.org/graphql", {
        body: JSON.stringify({
          query: `query MarketCollateral($marketId: String!) {
            marketByUniqueKey(uniqueKey: $marketId) {
              state {
                collateralAssets
              }
            }
          }`,
          variables: { marketId },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const json = await response.json();
      return BigInt(json.data.marketByUniqueKey.state.collateralAssets);
    },
    queryKey: ["market-collateral", marketId],
  });

export const useMarketCollateral = (marketId: Hash) =>
  useQuery(marketCollateralOptions(marketId));
