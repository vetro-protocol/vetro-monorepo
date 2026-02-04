import { useQuery } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import type { Address } from "viem";
import { balanceOf } from "viem-erc4626/actions";

const earnedAmountQueryKey = ({
  account,
  chainId,
  stakingVaultAddress,
}: {
  account: Address;
  chainId: number;
  stakingVaultAddress: Address;
}) => ["earned-amount", chainId, stakingVaultAddress, account];

export function useEarnedAmount({ account }: { account: Address | undefined }) {
  const chain = useMainnet();
  const client = useEthereumClient();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);

  return useQuery({
    enabled: !!client && !!account,
    queryFn: () =>
      balanceOf(client!, {
        account: account!,
        address: stakingVaultAddress,
      }),
    queryKey: earnedAmountQueryKey({
      account: account!,
      chainId: chain.id,
      stakingVaultAddress,
    }),
  });
}
