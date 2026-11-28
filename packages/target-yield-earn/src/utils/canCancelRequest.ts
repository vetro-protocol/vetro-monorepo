import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type WalletClient } from "viem";

import { getCancelableDepositRequest } from "../actions/public/getCancelableDepositRequest.ts";
import { getCancelableRedeemRequest } from "../actions/public/getCancelableRedeemRequest.ts";

import { getIsAccountOrOperator } from "./getIsAccountOrOperator.ts";

const getCancelableRequest = {
  deposit: getCancelableDepositRequest,
  redeem: getCancelableRedeemRequest,
};

export async function canCancelRequest({
  address,
  client,
  controller,
  request,
}: {
  address: Address;
  client: WalletClient;
  controller: Address;
  request: keyof typeof getCancelableRequest;
}): Promise<{
  canCancelRequest: boolean;
  reason?: string;
}> {
  if (!client) {
    return {
      canCancelRequest: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canCancelRequest: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  if (!client.account) {
    return {
      canCancelRequest: false,
      reason: "Client must have an account",
    };
  }
  if (!isAddressValid(address)) {
    return {
      canCancelRequest: false,
      reason: "Invalid vault address",
    };
  }
  if (!isAddressValid(controller)) {
    return {
      canCancelRequest: false,
      reason: "Invalid controller address",
    };
  }

  const account = client.account.address;
  const [isAuthorized, cancelableAmount] = await Promise.all([
    getIsAccountOrOperator({ account, address, client, owner: controller }),
    getCancelableRequest[request](client, { address, controller }),
  ]);

  if (!isAuthorized) {
    return {
      canCancelRequest: false,
      reason: "Account is not the controller or its operator",
    };
  }
  if (cancelableAmount === 0n) {
    return {
      canCancelRequest: false,
      reason: `No cancelable ${request} request`,
    };
  }

  return { canCancelRequest: true };
}
