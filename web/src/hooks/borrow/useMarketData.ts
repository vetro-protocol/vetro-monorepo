import { type MarketId } from "@morpho-org/blue-sdk";
import { Market } from "@morpho-org/blue-sdk-viem/lib/augment/Market";
import { queryOptions, useQuery } from "@tanstack/react-query";
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

export const marketInfoOptions = ({
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

export const useMarketData = function ({ marketId }: { marketId: Hash }) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();

  const marketQuery = useQuery(
    marketInfoOptions({
      chainId: ethereumChain.id,
      client: client!,
      marketId,
    }),
  );

  const collateralTokenQuery = useQuery(
    tokenInfoOptions({
      address: marketQuery.data?.collateralToken,
      chainId: ethereumChain.id,
      client,
    }),
  );

  const loanTokenQuery = useQuery(
    tokenInfoOptions({
      address: marketQuery.data?.loanToken,
      chainId: ethereumChain.id,
      client,
    }),
  );

  const data = useMemo(
    function () {
      const market = marketQuery.data;
      const collateralToken = collateralTokenQuery.data;
      const loanToken = loanTokenQuery.data;

      if (!market || !collateralToken || !loanToken) {
        return undefined;
      }

      return {
        borrowApy: market.borrowApy,
        collateralToken,
        liquidity: market.liquidity,
        lltv: market.lltv,
        loanToken,
        marketId,
        totalBorrowAssets: market.totalBorrowAssets,
        totalSupplyAssets: market.totalSupplyAssets,
      } satisfies MarketData;
    },
    [
      collateralTokenQuery.data,
      loanTokenQuery.data,
      marketId,
      marketQuery.data,
    ],
  );

  const isLoading =
    marketQuery.isLoading ||
    collateralTokenQuery.isLoading ||
    loanTokenQuery.isLoading;

  return { data, isLoading };
};
