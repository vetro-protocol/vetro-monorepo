import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import type { Address } from "viem";
import { convertToAssets } from "viem-erc4626/actions";
import { useAccount } from "wagmi";

export const stakedBalanceQueryKey = ({
  account,
  chainId,
  stakingVaultAddress,
}: {
  account: Address;
  chainId: number;
  stakingVaultAddress: Address;
}) => ["staked-balance", chainId, stakingVaultAddress, account];

export function useStakedBalance(stakingVaultAddress: Address) {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery({
    enabled: !!client && !!account,
    async queryFn() {
      const shares = await queryClient.ensureQueryData(
        tokenBalanceQueryOptions({
          account: account!,
          client: client!,
          token: { address: stakingVaultAddress, chainId: chain.id },
        }),
      );
      return convertToAssets(client!, {
        address: stakingVaultAddress,
        shares,
      });
    },
    queryKey: stakedBalanceQueryKey({
      account: account!,
      chainId: chain.id,
      stakingVaultAddress,
    }),
  });
}
