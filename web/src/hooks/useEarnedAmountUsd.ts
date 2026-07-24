import { useQuery, useQueryClient } from "@tanstack/react-query";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { fetchEarnedAmountUsd } from "fetchers/fetchEarnedAmountUsd";
import { useEthereumClient } from "hooks/useEthereumClient";
import { getVetroApiUrl, isValidUrl } from "utils/url";
import type { Address } from "viem";
import { useAccount } from "wagmi";

const apiUrl = getVetroApiUrl();

export const earnedAmountUsdQueryKey = ({
  account,
  chainId,
}: {
  account: Address | undefined;
  chainId: number | undefined;
}) => ["earned-amount-usd", chainId, account];

export function useEarnedAmountUsd() {
  const { address: account } = useAccount();
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery({
    enabled:
      apiUrl !== undefined && isValidUrl(apiUrl) && !!client && !!account,
    queryFn: () =>
      fetchEarnedAmountUsd({
        account: account!,
        client: client!,
        queryClient,
        stakingVaultAddresses,
      }),
    queryKey: earnedAmountUsdQueryKey({ account, chainId: client?.chain?.id }),
  });
}
