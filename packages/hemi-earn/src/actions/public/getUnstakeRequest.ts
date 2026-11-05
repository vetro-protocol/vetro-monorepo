import { isAddressValid } from "@vetro-protocol/core";
import type { Address, Client } from "viem";
import { readContract } from "viem/actions";

import { hemiEarnAgentAbi } from "../../abi/hemiEarnAgentAbi.ts";

export type UnstakeRequest = {
  amountOutMin: bigint;
  asset: Address;
  claimableAt: bigint;
  nativeFee: bigint;
  operator: Address;
  share: Address;
  shares: bigint;
  unstakingRequestId: bigint;
};

export const getUnstakeRequest = async function (
  client: Client,
  {
    address,
    requestId,
  }: {
    address: Address;
    requestId: bigint;
  },
): Promise<UnstakeRequest> {
  if (!client) {
    throw new Error("Client is not defined");
  }
  if (!isAddressValid(address)) {
    throw new Error("Agent address is invalid");
  }
  if (requestId <= 0n) {
    throw new Error("Request ID must be greater than zero");
  }

  return readContract(client, {
    abi: hemiEarnAgentAbi,
    address,
    args: [requestId],
    functionName: "unstakeRequests",
  });
};
