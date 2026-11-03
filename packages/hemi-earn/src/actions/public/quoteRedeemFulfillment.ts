import { isAddressValid } from "@vetro-protocol/core";
import type { Address, Client } from "viem";
import { readContract } from "viem/actions";

import { hemiEarnAgentAbi } from "../../abi/hemiEarnAgentAbi.ts";

// Native fee the Agent needs to send its redeem fulfillment back to Hemi; the caller
// folds it into requestRedeem's msg.value via quoteRedeem.
export const quoteRedeemFulfillment = async function (
  client: Client,
  {
    address,
    remoteAsset,
  }: {
    address: Address;
    remoteAsset: Address;
  },
): Promise<bigint> {
  if (!client) {
    throw new Error("Client is not defined");
  }
  if (!isAddressValid(address)) {
    throw new Error("Agent address is invalid");
  }
  if (!isAddressValid(remoteAsset)) {
    throw new Error("Remote asset address is invalid");
  }

  return readContract(client, {
    abi: hemiEarnAgentAbi,
    address,
    args: [remoteAsset],
    functionName: "quoteRedeemFulfillment",
  });
};
