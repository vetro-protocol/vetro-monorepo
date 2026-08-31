import { useQueries } from "@tanstack/react-query";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { useEthereumClient } from "hooks/useEthereumClient";
import { stakedUsdQueryOptions } from "hooks/useStakedUsd";
import { sumUsdResults } from "utils/queries";
import { useAccount } from "wagmi";

export function useTotalStakedUsd() {
  const { address: account } = useAccount();
  const client = useEthereumClient();

  return useQueries({
    combine: sumUsdResults,
    queries: stakingVaultAddresses.map((stakingVaultAddress) =>
      stakedUsdQueryOptions({ account, client, stakingVaultAddress }),
    ),
  });
}
