import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { fetchMarketData } from "fetchers/fetchMarketData";
import type { Token } from "types";
import type { Chain, Client, Hash } from "viem";

import { useEthereumClient } from "../useEthereumClient";
import { useMainnet } from "../useMainnet";

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

export const marketDataOptions = ({
  chainId,
  client,
  marketId,
  queryClient,
}: {
  chainId: Chain["id"];
  client: Client | undefined;
  marketId: Hash;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      fetchMarketData({ chainId, client: client!, marketId, queryClient }),
    queryKey: ["market-data", chainId, marketId],
  });

export const useMarketData = function (marketId: Hash) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(
    marketDataOptions({
      chainId: ethereumChain.id,
      client: client!,
      marketId,
      queryClient,
    }),
  );
};
