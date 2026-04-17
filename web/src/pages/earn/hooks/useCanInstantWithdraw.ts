import { queryOptions, useQuery } from "@tanstack/react-query";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { fetchCanInstantWithdraw } from "fetchers/fetchCanInstantWithdraw";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { type Address, type Chain, type Client } from "viem";
import { useAccount } from "wagmi";

export const canInstantWithdrawOptions = ({
  account,
  chainId,
  client,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  chainId: Chain["id"];
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      fetchCanInstantWithdraw({
        account,
        client: client!,
        stakingVaultAddress,
      }),
    queryKey: ["can-instant-withdraw", chainId, account, stakingVaultAddress],
  });

// TODO using the only staking vault address to simplify this PR
// we will handle multiple addresses in the next PR
const stakingVaultAddress = stakingVaultAddresses[0];

export function useCanInstantWithdraw() {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const client = useEthereumClient();

  return useQuery(
    canInstantWithdrawOptions({
      account,
      chainId: chain.id,
      client,
      stakingVaultAddress,
    }),
  );
}
