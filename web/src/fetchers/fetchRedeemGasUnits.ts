import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import type { QueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro-protocol/gateway";
import { encodeRedeem } from "@vetro-protocol/gateway/actions";
import { redeemDelayOptions } from "hooks/useRedeemDelay";
import { treasuryReservesOptions } from "hooks/useTreasuryReserves";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import { type Address, type Client, isAddressEqual } from "viem";
import { estimateGas } from "viem/actions";

import { estimateApprovalGasUnits } from "./estimateApprovalGasUnits";

/**
 * Estimates gas units for redeeming. Whitelisted users (redeemDelay === 0)
 * need an ERC-20 approval because tokens are sent directly to the gateway.
 * Two-step redeemers (redeemDelay > 0) skip the approval because their
 * tokens are already locked in the vault.
 * Throws if the amount exceeds the user's token balance (instant redeem) or
 * the treasury reserves for the output token (two-step redeem).
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
  const chainId = client.chain!.id;
  const gatewayAddress = getGatewayAddress(chainId);

  const redeemDelay = await queryClient.ensureQueryData(
    redeemDelayOptions({
      account: owner,
      chainId,
      client,
      gatewayAddress,
      queryClient,
    }),
  );

  // For instant redeems (redeemDelay === 0), tokens come from the user's
  // wallet, so check the balance. For vault redeems (redeemDelay > 0),
  // tokens are already locked in the contract.
  if (redeemDelay === 0n) {
    const balance = await queryClient.ensureQueryData(
      tokenBalanceQueryOptions({
        account: owner,
        client,
        token: { address: token.address, chainId },
      }),
    );

    if (amount > balance) {
      throw new Error("Insufficient token balance");
    }
  } else {
    const reserves = await queryClient.ensureQueryData(
      treasuryReservesOptions({ chainId, client, gatewayAddress, queryClient }),
    );
    const reserve = reserves.find((r) =>
      isAddressEqual(r.token.address, tokenOut),
    );
    if (!reserve) {
      throw new Error("Unknown output token");
    }
    if (minAmountOut > reserve.amount) {
      throw new Error("Insufficient treasury reserves");
    }
  }

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
