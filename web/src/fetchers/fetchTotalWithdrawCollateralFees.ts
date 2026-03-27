import type { QueryClient } from "@tanstack/react-query";
import { withdrawCollateralGasUnitsOptions } from "hooks/borrow/useWithdrawCollateralFees";
import { type Address, type Chain, type Client, type Hash } from "viem";

import { fetchTotalNetworkFees } from "./fetchTotalNetworkFees";

/**
 * Calculates the total fees in USD for a withdraw collateral operation.
 */
export const fetchTotalWithdrawCollateralFees = async function ({
  amount,
  chain,
  client,
  marketId,
  owner,
  queryClient,
}: {
  amount: bigint;
  chain: Chain;
  client: Client;
  marketId: Hash;
  owner: Address;
  queryClient: QueryClient;
}) {
  const gasUnits = await queryClient.ensureQueryData(
    withdrawCollateralGasUnitsOptions({
      amount,
      chainId: chain.id,
      client,
      marketId,
      owner,
      queryClient,
    }),
  );

  return fetchTotalNetworkFees({ chain, gasUnits, queryClient });
};
