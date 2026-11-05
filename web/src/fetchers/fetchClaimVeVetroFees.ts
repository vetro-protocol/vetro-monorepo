import type { QueryClient } from "@tanstack/react-query";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { hemi } from "hemi-viem";
import { getChainById } from "networks";
import type { Client } from "viem";

// Placeholder until the ve-vetro package has the `claim` write action.
// Replace with `estimateGas(client, { account, data: encodeClaim(...), to: distributorAddress })`.
const claimGasUnits = 600_000n;

export const fetchClaimVeVetroFees = ({
  queryClient,
}: {
  client: Client;
  queryClient: QueryClient;
}) =>
  fetchTotalNetworkFees({
    chain: getChainById(hemi.id),
    gasUnits: claimGasUnits,
    queryClient,
  });
