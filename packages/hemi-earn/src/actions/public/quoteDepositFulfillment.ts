import { isAddressValid } from "@vetro-protocol/core";
import type { Address, Client } from "viem";
import { readContract } from "viem/actions";

import { hemiEarnAgentAbi } from "../../abi/hemiEarnAgentAbi.ts";

// Native fee the Agent needs to send its fulfillment OFT back to Hemi; the caller
// folds it into requestDeposit's msg.value via quoteDeposit.
export const quoteDepositFulfillment = async function (
  client: Client,
  {
    address,
    remoteShare,
  }: {
    address: Address;
    remoteShare: Address;
  },
): Promise<bigint> {
  if (!client) {
    throw new Error("Client is not defined");
  }
  if (!isAddressValid(address)) {
    throw new Error("Agent address is invalid");
  }
  if (!isAddressValid(remoteShare)) {
    throw new Error("Remote share address is invalid");
  }

  return readContract(client, {
    abi: hemiEarnAgentAbi,
    address,
    args: [remoteShare],
    functionName: "quoteDepositFulfillment",
  });
};
