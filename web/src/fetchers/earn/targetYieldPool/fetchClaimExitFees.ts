import type { QueryClient } from "@tanstack/react-query";
import { encodeClaimRedeem } from "@vetro-protocol/target-yield-earn/actions";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { getChainById } from "networks";
import type { Address, Client } from "viem";
import { estimateGas } from "viem/actions";

export const fetchClaimExitFees = async function ({
  client,
  controller,
  queryClient,
  shares,
  stakingVaultAddress,
}: {
  client: Client;
  controller: Address;
  queryClient: QueryClient;
  shares: bigint;
  stakingVaultAddress: Address;
}) {
  const gasUnits = await estimateGas(client, {
    account: controller,
    data: encodeClaimRedeem({
      address: stakingVaultAddress,
      controller,
      shares,
    }),
    to: stakingVaultAddress,
  });

  return fetchTotalNetworkFees({
    chain: getChainById(client.chain!.id),
    gasUnits,
    queryClient,
  });
};
