import type { QueryClient } from "@tanstack/react-query";
import { borrowGasUnitsOptions } from "hooks/borrow/useBorrowMoreFees";
import { type Address, type Chain, type Client, type Hash } from "viem";

import { fetchTotalNetworkFees } from "./fetchTotalNetworkFees";

/**
 * Calculates the total fees in USD for a borrow operation.
 */
export const fetchTotalBorrowFees = async function ({
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
    borrowGasUnitsOptions({
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
