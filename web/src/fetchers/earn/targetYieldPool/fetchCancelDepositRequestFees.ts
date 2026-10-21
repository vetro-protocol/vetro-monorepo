import type { QueryClient } from "@tanstack/react-query";
import { encodeCancelDepositRequest } from "@vetro-protocol/target-yield-earn/actions";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { getChainById } from "networks";
import type { Address, Client } from "viem";
import { estimateGas } from "viem/actions";

export const fetchCancelDepositRequestFees = async function ({
  client,
  controller,
  queryClient,
  stakingVaultAddress,
}: {
  client: Client;
  controller: Address;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}) {
  const gasUnits = await estimateGas(client, {
    account: controller,
    data: encodeCancelDepositRequest({
      address: stakingVaultAddress,
      controller,
    }),
    to: stakingVaultAddress,
  });

  return fetchTotalNetworkFees({
    chain: getChainById(client.chain!.id),
    gasUnits,
    queryClient,
  });
};
