import type { QueryClient } from "@tanstack/react-query";
import { withdrawGasUnitsOptions } from "pages/earn/hooks/useWithdrawFees";
import { type Address, type Chain, type Client } from "viem";

import { fetchTotalNetworkFees } from "./fetchTotalNetworkFees";

/**
 * Calculates the total fees in USD for an earn withdraw.
 */
export const fetchTotalWithdrawFees = async function ({
  amount,
  chain,
  client,
  owner,
  queryClient,
  stakingVaultAddress,
}: {
  amount: bigint;
  chain: Chain;
  client: Client;
  owner: Address;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}) {
  const gasUnits = await queryClient.ensureQueryData(
    withdrawGasUnitsOptions({
      account: owner,
      amount,
      chainId: chain.id,
      client,
      queryClient,
      stakingVaultAddress,
    }),
  );

  return fetchTotalNetworkFees({ chain, gasUnits, queryClient });
};
