import type { QueryClient } from "@tanstack/react-query";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { veVetroChain } from "networks";
import type { Client } from "viem";

// `estimateGas` with `encodeClaim` reverts before the user signs the terms,
// because the distributor checks the signature. The drawer shows the fee before
// that signature.
const claimGasUnits = 600_000n;

export const fetchClaimVeVetroFees = ({
  queryClient,
}: {
  client: Client;
  queryClient: QueryClient;
}) =>
  fetchTotalNetworkFees({
    chain: veVetroChain,
    gasUnits: claimGasUnits,
    queryClient,
  });
