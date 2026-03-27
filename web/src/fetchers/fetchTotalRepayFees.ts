import type { QueryClient } from "@tanstack/react-query";
import { repayGasUnitsOptions } from "hooks/borrow/useRepayFees";
import type { Token } from "types";
import { type Address, type Chain, type Client, type Hash } from "viem";

import { fetchTotalNetworkFees } from "./fetchTotalNetworkFees";

/**
 * Calculates the total fees in USD for a repay operation.
 */
export const fetchTotalRepayFees = async function ({
  amount,
  approveAmount,
  chain,
  client,
  marketId,
  owner,
  queryClient,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chain: Chain;
  client: Client;
  marketId: Hash;
  owner: Address;
  queryClient: QueryClient;
  token: Token;
}) {
  const gasUnits = await queryClient.ensureQueryData(
    repayGasUnitsOptions({
      amount,
      approveAmount,
      chainId: chain.id,
      client,
      marketId,
      owner,
      queryClient,
      token,
    }),
  );

  return fetchTotalNetworkFees({ chain, gasUnits, queryClient });
};
