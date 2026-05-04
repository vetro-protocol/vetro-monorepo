import { useQuery, useQueryClient } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { useEthereumClient } from "hooks/useEthereumClient";
import { stakingVaultForPeggedTokenOptions } from "hooks/useStakingVaultForPeggedToken";
import type { TokenWithGateway } from "types";
import { isValidUrl } from "utils/url";

export const shareValueHistoryPeriods = ["1w", "1m", "3m", "1y"] as const;
export type ShareValueHistoryPeriod = (typeof shareValueHistoryPeriods)[number];

type ApiEntry = { shareValue: number; timestamp: number };

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const useShareValueHistory = function ({
  peggedToken,
  period,
}: {
  peggedToken: TokenWithGateway | undefined;
  period: ShareValueHistoryPeriod;
}) {
  const client = useEthereumClient();
  const queryClient = useQueryClient();
  return useQuery({
    enabled:
      !!client && !!peggedToken && apiUrl !== undefined && isValidUrl(apiUrl),
    async queryFn() {
      const stakingVaultAddress = await queryClient.ensureQueryData(
        stakingVaultForPeggedTokenOptions({
          chainId: client!.chain!.id,
          client: client!,
          peggedTokenAddress: peggedToken!.address,
          queryClient,
        }),
      );
      const data: ApiEntry[] = await fetch(
        `${apiUrl}/variable-stake/share-value-history/${stakingVaultAddress}/${period}`,
      );
      return data.map((entry) => ({ x: entry.timestamp, y: entry.shareValue }));
    },
    // peggedToken.address is technically redundant — the gateway uniquely
    // determines it via a 1:1 mapping. Included anyway to mirror every
    // queryFn dependency in the cache key, per React Query's contract.
    queryKey: [
      "share-value-history",
      client?.chain?.id,
      peggedToken?.address,
      peggedToken?.gatewayAddress,
      period,
    ],
    staleTime: 5 * 60 * 1000,
  });
};
