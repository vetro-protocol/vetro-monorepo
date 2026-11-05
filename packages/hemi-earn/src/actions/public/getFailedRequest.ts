import { isAddressValid } from "@vetro-protocol/core";
import type { Address, Client, Hex } from "viem";
import { readContract } from "viem/actions";

import { hemiEarnAgentAbi } from "../../abi/hemiEarnAgentAbi.ts";

export type FailedRequest = {
  amountIn: bigint;
  msg: Hex;
  nativeFee: bigint;
  tokenIn: Address;
};

export const getFailedRequest = async function (
  client: Client,
  {
    address,
    requestId,
  }: {
    address: Address;
    requestId: bigint;
  },
): Promise<FailedRequest> {
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
    functionName: "failedRequests",
  });
};
