import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import type { QueryClient } from "@tanstack/react-query";
import { encodeDeposit } from "@vetro-protocol/gateway/actions";
import type { TokenWithGateway } from "types";
import { createErc20SpendStateOverride } from "utils/erc20StateOverride";
import type { Address, Client } from "viem";
import { estimateGas } from "viem/actions";

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
  token: TokenWithGateway;
}) {
  const balance = await queryClient.ensureQueryData(
    tokenBalanceQueryOptions({
      account: owner,
      client,
      token,
    }),
  );

  const [approvalGas, mintGas] = await Promise.all([
    estimateApprovalGasUnits({
      amount,
      approveAmount,
      client,
      owner,
      queryClient,
      spender: token.gatewayAddress,
      token,
    }),
    estimateGas(client, {
      account: owner,
      data: encodeDeposit({
        amountIn: amount,
        minPeggedTokenOut,
        receiver: owner,
        tokenIn: token.address,
      }),
      stateOverride: createErc20SpendStateOverride({
        amount,
        balance,
        owner,
        spender: token.gatewayAddress,
        token,
      }),
      to: token.gatewayAddress,
    }),
  ]);

  return approvalGas + mintGas;
};
