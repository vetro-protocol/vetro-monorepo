import { useQueries } from "@tanstack/react-query";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { earnedAmountUsdQueryOptions } from "hooks/useEarnedAmountUsd";
import { useEthereumClient } from "hooks/useEthereumClient";
import { sumUsdResults } from "utils/queries";
import { useAccount } from "wagmi";

export function useTotalEarnedAmountUsd() {
  const { address: account } = useAccount();
  const client = useEthereumClient();

  return useQueries({
    combine: sumUsdResults,
    queries: stakingVaultAddresses.map((stakingVaultAddress) =>
      earnedAmountUsdQueryOptions({ account, client, stakingVaultAddress }),
    ),
  });
}
