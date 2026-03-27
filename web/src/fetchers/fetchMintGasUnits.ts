import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import type { QueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { encodeDeposit } from "@vetro/gateway/actions";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import type { Address, Client } from "viem";
import { estimateGas } from "viem/actions";

import { estimateApprovalGasUnits } from "./estimateApprovalGasUnits";

/**
 * Estimates gas units for minting. Minting always requires approving the
 * tokens sent to the gateway. Returns the total gas units for the whole flow
 * (approval + deposit).
 * Throws if the amount exceeds the user's token balance.
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
  const chainId = client.chain!.id;
  const gatewayAddress = getGatewayAddress(chainId);

  const balance = await queryClient.ensureQueryData(
    tokenBalanceQueryOptions({
      account: owner,
      client,
      token,
    }),
  );

  if (amount > balance) {
    throw new Error("Insufficient token balance");
  }

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
    estimateGas(client, {
      account: owner,
      data: encodeDeposit({
        amountIn: amount,
        minPeggedTokenOut,
        receiver: owner,
        tokenIn: token.address,
      }),
      stateOverride: createErc20AllowanceStateOverride({
        owner,
        spender: gatewayAddress,
        token,
      }),
      to: gatewayAddress,
    }),
  ]);

  return approvalGas + mintGas;
};
