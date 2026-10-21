import type { QueryClient } from "@tanstack/react-query";
import { encodeRequestRedeem } from "@vetro-protocol/target-yield-earn/actions";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { getChainById } from "networks";
import type { Address, Client } from "viem";
import { estimateGas } from "viem/actions";

export const fetchRequestExitFees = async function ({
  client,
  owner,
  queryClient,
  shares,
  stakingVaultAddress,
}: {
  client: Client;
  owner: Address;
  queryClient: QueryClient;
  shares: bigint;
  stakingVaultAddress: Address;
}) {
  const gasUnits = await estimateGas(client, {
    account: owner,
    data: encodeRequestRedeem({ controller: owner, owner, shares }),
    to: stakingVaultAddress,
  });

  return fetchTotalNetworkFees({
    chain: getChainById(client.chain!.id),
    gasUnits,
    queryClient,
  });
};
