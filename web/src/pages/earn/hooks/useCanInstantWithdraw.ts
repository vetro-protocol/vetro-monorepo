import { queryOptions, useQuery } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro-protocol/earn";
import { fetchCanInstantWithdraw } from "fetchers/fetchCanInstantWithdraw";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { type Address, type Chain, type Client } from "viem";
import { useAccount } from "wagmi";

export const canInstantWithdrawOptions = ({
  account,
  chainId,
  client,
}: {
  account: Address | undefined;
  chainId: Chain["id"];
  client: Client | undefined;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      fetchCanInstantWithdraw({
        account,
        client: client!,
        stakingVaultAddress: getStakingVaultAddress(chainId),
      }),
    queryKey: ["can-instant-withdraw", chainId, account],
  });

export function useCanInstantWithdraw() {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const client = useEthereumClient();

  return useQuery(
    canInstantWithdrawOptions({
      account,
      chainId: chain.id,
      client,
    }),
  );
}
