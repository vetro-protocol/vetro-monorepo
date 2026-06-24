import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchAnalyticsTotals } from "fetchers/fetchAnalyticsTotals";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { TokenWithGateway } from "types";
import type { Address, Client } from "viem";

export const analyticsTotalsQueryKey = ({
  chainId,
  gatewayAddress,
}: {
  chainId: number | undefined;
  gatewayAddress: Address | undefined;
}) => ["analytics-totals", chainId, gatewayAddress];

const analyticsTotalsOptions = ({
  client,
  peggedToken,
  queryClient,
}: {
  client: Client | undefined;
  peggedToken: TokenWithGateway | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client && !!peggedToken,
    queryFn: () =>
      fetchAnalyticsTotals({
        chainId: client!.chain!.id,
        client: client!,
        peggedToken: peggedToken!,
        queryClient,
      }),
    queryKey: analyticsTotalsQueryKey({
      chainId: client?.chain?.id,
      gatewayAddress: peggedToken?.gatewayAddress,
    }),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useAnalyticsTotals = function (
  peggedToken: TokenWithGateway | undefined,
) {
  const client = useEthereumClient();
  const queryClient = useQueryClient();
  return useQuery(analyticsTotalsOptions({ client, peggedToken, queryClient }));
};
