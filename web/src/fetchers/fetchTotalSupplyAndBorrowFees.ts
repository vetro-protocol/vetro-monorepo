import type { QueryClient } from "@tanstack/react-query";
import { supplyAndBorrowGasUnitsOptions } from "hooks/borrow/useSupplyAndBorrowFees";
import type { Token } from "types";
import { type Address, type Chain, type Client, type Hash } from "viem";

import { fetchTotalNetworkFees } from "./fetchTotalNetworkFees";

/**
 * Calculates the total fees in USD for a supply collateral + borrow operation.
 */
export const fetchTotalSupplyAndBorrowFees = async function ({
  approveAmount,
  borrowAmount,
  chain,
  client,
  collateralAmount,
  collateralToken,
  marketId,
  owner,
  queryClient,
}: {
  approveAmount: bigint | undefined;
  borrowAmount: bigint;
  chain: Chain;
  client: Client;
  collateralAmount: bigint;
  collateralToken: Token;
  marketId: Hash;
  owner: Address;
  queryClient: QueryClient;
}) {
  const gasUnits = await queryClient.ensureQueryData(
    supplyAndBorrowGasUnitsOptions({
      approveAmount,
      borrowAmount,
      chainId: chain.id,
      client,
      collateralAmount,
      collateralToken,
      marketId,
      owner,
      queryClient,
    }),
  );

  return fetchTotalNetworkFees({ chain, gasUnits, queryClient });
};
