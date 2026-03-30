import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import type { QueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { encodeRequestRedeem } from "@vetro/gateway/actions";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import type { Address, Client } from "viem";
import { estimateGas } from "viem/actions";

import { estimateApprovalGasUnits } from "./estimateApprovalGasUnits";

/**
 * Estimates gas units for requesting a redeem. Requesting a redeem locks tokens
 * in the vault, so an ERC-20 approval may be needed before the operation.
 * Returns the total gas units for the whole flow (1 or 2 transactions:
 * optional approval + requestRedeem).
 * Throws if the amount exceeds the user's token balance.
 */
export const fetchRequestRedeemGasUnits = async function ({
  amount,
  approveAmount,
  client,
  owner,
  queryClient,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  client: Client;
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

  const [approvalGas, operationGas] = await Promise.all([
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
      data: encodeRequestRedeem({
        peggedTokenAmount: amount,
      }),
      stateOverride: createErc20AllowanceStateOverride({
        owner,
        spender: gatewayAddress,
        token,
      }),
      to: gatewayAddress,
    }),
  ]);

  return approvalGas + operationGas;
};
