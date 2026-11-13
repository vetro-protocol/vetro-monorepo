import type { QueryClient } from "@tanstack/react-query";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { veVetroChain } from "networks";
import type { Client } from "viem";

// `estimateGas` with `encodeClaim` reverts before the user signs the terms,
// because the distributor checks the signature. The drawer shows the fee before
// that signature. The units are rounded up from testnet claims: 879k gas for
// 3 positions, 1.04-1.17M for 8 and 1.83M for 44.
const baseGasUnits = 1_100_000n;
const gasUnitsPerPosition = 18_000n;

export const fetchClaimVeVetroFees = ({
  positionCount,
  queryClient,
}: {
  client: Client;
  positionCount: number;
  queryClient: QueryClient;
}) =>
  fetchTotalNetworkFees({
    chain: veVetroChain,
    gasUnits: baseGasUnits + gasUnitsPerPosition * BigInt(positionCount),
    queryClient,
  });
