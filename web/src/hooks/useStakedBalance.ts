import { useQuery } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import { fetchStakedBalance } from "fetchers/fetchStakedBalance";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import type { Address } from "viem";

const stakedBalanceQueryKey = ({
  account,
  chainId,
  stakingVaultAddress,
}: {
  account: Address;
  chainId: number;
  stakingVaultAddress: Address;
}) => ["staked-balance", chainId, stakingVaultAddress, account];

export function useStakedBalance({
  account,
}: {
  account: Address | undefined;
}) {
  const chain = useMainnet();
  const client = useEthereumClient();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);

  return useQuery({
    enabled: !!client && !!account,
    queryFn: () =>
      fetchStakedBalance({
        account: account!,
        client: client!,
        stakingVaultAddress,
      }),
    queryKey: stakedBalanceQueryKey({
      account: account!,
      chainId: chain.id,
      stakingVaultAddress,
    }),
  });
}
