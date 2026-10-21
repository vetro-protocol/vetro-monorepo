import type { QueryClient } from "@tanstack/react-query";
import { encodeClaimDeposit } from "@vetro-protocol/target-yield-earn/actions";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { getChainById } from "networks";
import type { Address, Client } from "viem";
import { estimateGas } from "viem/actions";

export const fetchClaimDepositFees = async function ({
  assets,
  client,
  controller,
  queryClient,
  stakingVaultAddress,
}: {
  assets: bigint;
  client: Client;
  controller: Address;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}) {
  const gasUnits = await estimateGas(client, {
    account: controller,
    data: encodeClaimDeposit({
      address: stakingVaultAddress,
      assets,
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
