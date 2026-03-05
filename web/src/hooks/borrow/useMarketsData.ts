import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Hash } from "viem";

import { useEthereumClient } from "../useEthereumClient";
import { useMainnet } from "../useMainnet";
import { tokenInfoOptions } from "../useTokenInfo";

import {
  type MarketData,
  marketInfoOptions,
  marketInfoQueryKey,
} from "./useMarketData";

export { type MarketData, marketInfoQueryKey };

export const useMarketsData = function (marketIds: Hash[]) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();

  const marketQueries = useQueries({
    queries: marketIds.map((marketId) =>
      marketInfoOptions({
        chainId: ethereumChain.id,
        client: client!,
        marketId,
      }),
    ),
  });

  const collateralTokenAddresses = marketQueries.map(
    (q) => q.data?.collateralToken,
  );
  const loanTokenAddresses = marketQueries.map((q) => q.data?.loanToken);

  const collateralTokenQueries = useQueries({
    queries: collateralTokenAddresses.map((address) =>
      tokenInfoOptions({
        address,
        chainId: ethereumChain.id,
        client: client!,
      }),
    ),
  });

  const loanTokenQueries = useQueries({
    queries: loanTokenAddresses.map((address) =>
      tokenInfoOptions({
        address,
        chainId: ethereumChain.id,
        client: client!,
      }),
    ),
  });

  const data = useMemo(
    () =>
      marketIds.reduce<MarketData[]>(function (acc, marketId, i) {
        const market = marketQueries[i].data;
        const collateralToken = collateralTokenQueries[i]?.data;
        const loanToken = loanTokenQueries[i]?.data;

        if (market && collateralToken && loanToken) {
          acc.push({
            borrowApy: market.borrowApy,
            collateralToken,
            liquidity: market.liquidity,
            lltv: market.lltv,
            loanToken,
            marketId,
            totalBorrowAssets: market.totalBorrowAssets,
            totalSupplyAssets: market.totalSupplyAssets,
          });
        }

        return acc;
      }, []),
    [collateralTokenQueries, loanTokenQueries, marketIds, marketQueries],
  );

  const isLoading =
    marketQueries.some((q) => q.isLoading) ||
    collateralTokenQueries.some((q) => q.isLoading) ||
    loanTokenQueries.some((q) => q.isLoading);

  return { data, isLoading };
};
