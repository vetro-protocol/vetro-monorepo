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

export const useShareValueHistory = function (
  peggedToken: TokenWithGateway | undefined,
  period: ShareValueHistoryPeriod,
) {
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
    queryKey: [
      "share-value-history",
      client?.chain?.id,
      peggedToken?.gatewayAddress,
      period,
    ],
    staleTime: 5 * 60 * 1000,
  });
};
