import type { QueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { encodeRedeem } from "@vetro/gateway/actions";
import { redeemDelayOptions } from "hooks/useRedeemDelay";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import type { Address, Client } from "viem";
import { estimateGas } from "viem/actions";

import { estimateApprovalGasUnits } from "./estimateApprovalGasUnits";

/**
 * Estimates gas units for redeeming. Whitelisted users (redeemDelay === 0)
 * need an ERC-20 approval because tokens are sent directly to the gateway.
 * Two-step redeemers (redeemDelay > 0) skip the approval because their
 * tokens are already locked in the vault.
 */
export const fetchRedeemGasUnits = async function ({
  amount,
  approveAmount,
  client,
  minAmountOut,
  owner,
  queryClient,
  token,
  tokenOut,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  client: Client;
  minAmountOut: bigint;
  owner: Address;
  queryClient: QueryClient;
  token: Token;
  tokenOut: Address;
}) {
  const gatewayAddress = getGatewayAddress(client.chain!.id);

  const redeemDelay = await queryClient.ensureQueryData(
    redeemDelayOptions({
      account: owner,
      chainId: client.chain!.id,
      client,
      gatewayAddress,
      queryClient,
    }),
  );

  const operationGasPromise = estimateGas(client, {
    account: owner,
    data: encodeRedeem({
      minAmountOut,
      peggedTokenIn: amount,
      receiver: owner,
      tokenOut,
    }),
    stateOverride: createErc20AllowanceStateOverride({
      owner,
      spender: gatewayAddress,
      token,
    }),
    to: gatewayAddress,
  });

  // When there's a delay, user can't instant redeem so no approval needed
  // the only gas units are spend on the redeeming locked tokens in the vault.
  if (redeemDelay > 0n) {
    return operationGasPromise;
  }

  // The user is whitelisted, so they need to approve vusd
  // tokens that will be redeemed.
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
    operationGasPromise,
  ]);

  return approvalGas + operationGas;
};
