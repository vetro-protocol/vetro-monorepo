import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { stakedBalanceQueryOptions } from "hooks/useStakedBalance";
import { vaultPeggedTokenQueryOptions } from "hooks/useVaultPeggedToken";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

const poolStakedAmountOptions = ({
  account,
  chainId,
  client,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  chainId: number;
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!account,
    async queryFn({ client: queryClient }) {
      const [peggedToken, stakedBalance] = await Promise.all([
        queryClient.ensureQueryData(
          vaultPeggedTokenQueryOptions({
            client,
            queryClient,
            stakingVaultAddress,
          }),
        ),
        queryClient.ensureQueryData(
          stakedBalanceQueryOptions({
            account,
            chainId,
            client,
            queryClient,
            stakingVaultAddress,
          }),
        ),
      ]);
      return { peggedToken, stakedBalance };
    },
    queryKey: ["pool-staked-amount", chainId, stakingVaultAddress, account],
  });

export function usePoolStakedAmount(stakingVaultAddress: Address) {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const client = useEthereumClient();

  return useQuery(
    poolStakedAmountOptions({
      account,
      chainId: chain.id,
      client,
      stakingVaultAddress,
    }),
  );
}
