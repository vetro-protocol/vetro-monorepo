import { useQueries } from "@tanstack/react-query";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { useAccount } from "wagmi";

import { canInstantWithdrawOptions } from "./useCanInstantWithdraw";

export function useShowExitTickets() {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const client = useEthereumClient();

  return useQueries({
    // Show the exit tickets section when at least one vault cannot
    // instant-withdraw (including while still loading), since that vault
    // requires the non-instant request flow that produces exit tickets.
    combine: (results) => ({
      data: results.some((result) => result.data === false),
    }),
    queries: stakingVaultAddresses.map((stakingVaultAddress) =>
      canInstantWithdrawOptions({
        account,
        chainId: chain.id,
        client,
        stakingVaultAddress,
      }),
    ),
  });
}
