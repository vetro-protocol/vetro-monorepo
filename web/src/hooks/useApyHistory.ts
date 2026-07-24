import { queryOptions, useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { useEthereumClient } from "hooks/useEthereumClient";
import { stakingVaultForPeggedTokenOptions } from "hooks/useStakingVaultForPeggedToken";
import type { TokenWithGateway } from "types";
import type { ChartPeriod } from "utils/chartPeriods";
import { getVetroApiUrl, isValidUrl } from "utils/url";
import type { Client } from "viem";

type ApiEntry = { apy: number; timestamp: number };

const apiUrl = getVetroApiUrl();

const apyHistoryOptions = ({
  client,
  peggedToken,
  period,
}: {
  client: Client | undefined;
  peggedToken: TokenWithGateway | undefined;
  period: ChartPeriod;
}) =>
  queryOptions({
    enabled:
      !!client && !!peggedToken && apiUrl !== undefined && isValidUrl(apiUrl),
    async queryFn({ client: queryClient }) {
      const stakingVaultAddress = await queryClient.ensureQueryData(
        stakingVaultForPeggedTokenOptions({
          chainId: client!.chain!.id,
          client: client!,
          peggedTokenAddress: peggedToken!.address,
          queryClient,
        }),
      );
      const data: ApiEntry[] = await fetch(
        `${apiUrl}/variable-stake/apy-history/${stakingVaultAddress}/${period}`,
      );
      return data.map((entry) => ({ x: entry.timestamp, y: entry.apy }));
    },
    queryKey: ["apy-history", client?.chain?.id, peggedToken?.address, period],
    staleTime: 5 * 60 * 1000,
  });

export const useApyHistory = function ({
  peggedToken,
  period,
}: {
  peggedToken: TokenWithGateway | undefined;
  period: ChartPeriod;
}) {
  const client = useEthereumClient();
  return useQuery(apyHistoryOptions({ client, peggedToken, period }));
};
