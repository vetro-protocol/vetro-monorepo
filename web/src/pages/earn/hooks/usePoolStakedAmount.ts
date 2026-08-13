import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { stakedBalanceQueryOptions } from "hooks/useStakedBalance";
import { vaultPeggedTokenQueryOptions } from "hooks/useVaultPeggedToken";
import type { Address } from "viem";
import { useAccount } from "wagmi";

// Both queries are observed instead of being read through `ensureQueryData`:
// the staking mutations patch the staked balance with `setQueryData`, and a
// derived copy of it would keep rendering the pre-transaction amount until it
// happened to refetch.
export function usePoolStakedAmount(stakingVaultAddress: Address) {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  const [peggedToken, stakedBalance] = useQueries({
    queries: [
      vaultPeggedTokenQueryOptions({
        client,
        queryClient,
        stakingVaultAddress,
      }),
      stakedBalanceQueryOptions({
        account,
        chainId: chain.id,
        client,
        queryClient,
        stakingVaultAddress,
      }),
    ],
  });

  return {
    data:
      peggedToken.data !== undefined && stakedBalance.data !== undefined
        ? { peggedToken: peggedToken.data, stakedBalance: stakedBalance.data }
        : undefined,
    isError: peggedToken.isError || stakedBalance.isError,
    isPending: peggedToken.isPending || stakedBalance.isPending,
  };
}
