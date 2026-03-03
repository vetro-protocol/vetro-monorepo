import { type MarketId } from "@morpho-org/blue-sdk";
import { Market } from "@morpho-org/blue-sdk-viem/lib/augment/Market";
import { queryOptions, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Token } from "types";
import { unixNowTimestamp } from "utils/date";
import type { Chain, Client, Hash } from "viem";

import { useEthereumClient } from "../useEthereumClient";
import { useMainnet } from "../useMainnet";
import { tokenInfoOptions } from "../useTokenInfo";

export const marketInfoQueryKey = ({
  chainId,
  marketId,
}: {
  chainId: Chain["id"];
  marketId: Hash;
}) => ["market-info", chainId, marketId];

const marketInfoOptions = ({
  chainId,
  client,
  marketId,
}: {
  chainId: Chain["id"];
  client: Client;
  marketId: Hash;
}) =>
  queryOptions({
    enabled: !!client,
    async queryFn() {
      const market = await Market.fetch(marketId as MarketId, client);
      const accrued = market.accrueInterest(BigInt(unixNowTimestamp()));

      return {
        borrowApy: accrued.borrowApy,
        collateralToken: market.params.collateralToken,
        liquidity: market.liquidity,
        lltv: market.params.lltv,
        loanToken: market.params.loanToken,
        totalBorrowAssets: market.totalBorrowAssets,
        totalSupplyAssets: market.totalSupplyAssets,
      };
    },
    queryKey: marketInfoQueryKey({ chainId, marketId }),
  });

export type MarketData = {
  borrowApy: number;
  collateralToken: Token;
  liquidity: bigint;
  lltv: bigint;
  loanToken: Token;
  marketId: Hash;
  totalBorrowAssets: bigint;
  totalSupplyAssets: bigint;
};

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
