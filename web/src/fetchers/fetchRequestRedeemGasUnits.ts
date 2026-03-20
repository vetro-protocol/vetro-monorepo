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
  const gatewayAddress = getGatewayAddress(client.chain!.id);

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
