import type { QueryClient } from "@tanstack/react-query";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { getChainById } from "networks";
import { veVetroChain } from "utils/veVetro";
import type { Client } from "viem";

// Placeholder until the ve-vetro package (#1062) has the `claim` write action.
// Replace with `estimateGas(client, { account, data: encodeClaim(...), to: distributorAddress })`.
const claimGasUnits = 600_000n;

export const fetchClaimVeVetroFees = ({
  queryClient,
}: {
  client: Client;
  queryClient: QueryClient;
}) =>
  fetchTotalNetworkFees({
    chain: getChainById(veVetroChain.id),
    gasUnits: claimGasUnits,
    queryClient,
  });
