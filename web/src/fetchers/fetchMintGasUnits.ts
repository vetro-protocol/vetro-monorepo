import type { QueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { depositGasUnitsOptions } from "hooks/useEstimateDepositGas";
import type { Token } from "types";
import type { Address, Client } from "viem";

import { estimateApprovalGasUnits } from "./estimateApprovalGasUnits";

/**
 * Estimates gas units for minting. Minting always requires approving the
 * tokens sent to the gateway. Returns the total gas units for the whole flow
 * (approval + deposit).
 */
export const fetchMintGasUnits = async function ({
  amount,
  approveAmount,
  client,
  minPeggedTokenOut,
  owner,
  queryClient,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  client: Client;
  minPeggedTokenOut: bigint;
  owner: Address;
  queryClient: QueryClient;
  token: Token;
}) {
  const gatewayAddress = getGatewayAddress(client.chain!.id);

  const [approvalGas, mintGas] = await Promise.all([
    estimateApprovalGasUnits({
      amount,
      approveAmount,
      client,
      owner,
      queryClient,
      spender: gatewayAddress,
      token,
    }),
    queryClient.ensureQueryData(
      depositGasUnitsOptions({
        amountIn: amount,
        chainId: client.chain!.id,
        client,
        minPeggedTokenOut,
        owner,
        token,
      }),
    ),
  ]);

  return approvalGas + mintGas;
};
