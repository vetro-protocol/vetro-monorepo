import type { QueryClient } from "@tanstack/react-query";
import { requestRedeemGasUnitsOptions } from "hooks/useSwapRequestRedeemFees";
import type { Token } from "types";
import { type Address, type Chain, type Client } from "viem";

import { fetchTotalNetworkFees } from "./fetchTotalNetworkFees";

/**
 * Calculates the total fees in USD for requesting a redeem. Does not include
 * protocol fees, as requesting a redeem only incurs network fees.
 */
export const fetchTotalRequestRedeemFees = async function ({
  amount,
  approveAmount,
  chain,
  client,
  fromToken,
  owner,
  queryClient,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  chain: Chain;
  client: Client;
  fromToken: Token;
  owner: Address;
  queryClient: QueryClient;
}) {
  const gasUnits = await queryClient.ensureQueryData(
    requestRedeemGasUnitsOptions({
      amount,
      approveAmount,
      chainId: chain.id,
      client,
      fromToken,
      owner,
      queryClient,
    }),
  );

  return fetchTotalNetworkFees({ chain, gasUnits, queryClient });
};
