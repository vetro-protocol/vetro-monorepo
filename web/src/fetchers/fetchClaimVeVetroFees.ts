import type { QueryClient } from "@tanstack/react-query";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { getChainById } from "networks";
import { hemi } from "viem/chains";

// Placeholder until the ve-vetro package (#1062) has the `claim` write action.
// Replace with `estimateGas(hemiClient, { account, data: encodeClaim(...), to: distributorAddress })`.
const claimGasUnits = 600_000n;

export const fetchClaimVeVetroFees = ({
  queryClient,
}: {
  queryClient: QueryClient;
}) =>
  fetchTotalNetworkFees({
    chain: getChainById(hemi.id),
    gasUnits: claimGasUnits,
    queryClient,
  });
