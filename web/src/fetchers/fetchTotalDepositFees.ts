import type { QueryClient } from "@tanstack/react-query";
import { depositGasUnitsOptions } from "pages/earn/hooks/useDepositFees";
import type { Token } from "types";
import { type Address, type Chain, type Client } from "viem";

import { fetchTotalNetworkFees } from "./fetchTotalNetworkFees";

/**
 * Calculates the total fees in USD for an earn deposit.
 */
export const fetchTotalDepositFees = async function ({
  amount,
  approveAmount,
  chain,
  client,
  owner,
  queryClient,
  stakingVaultAddress,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chain: Chain;
  client: Client;
  owner: Address;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
  token: Token;
}) {
  const gasUnits = await queryClient.ensureQueryData(
    depositGasUnitsOptions({
      amount,
      approveAmount,
      chainId: chain.id,
      client,
      owner,
      queryClient,
      stakingVaultAddress,
      token,
    }),
  );

  return fetchTotalNetworkFees({ chain, gasUnits, queryClient });
};
