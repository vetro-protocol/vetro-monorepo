import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client, getAddress, slice } from "viem";
import { readContract } from "viem/actions";

import { hemiEarnRouterAbi } from "../../abi/hemiEarnRouterAbi.ts";
import { hemiEarnRouterAddress } from "../../constants.ts";

// The LayerZero peer is a left-padded bytes32; the Agent address is its trailing 20 bytes.
export const getAgentAddress = async function (
  client: Client,
  { address = hemiEarnRouterAddress }: { address?: Address } = {},
): Promise<Address> {
  if (!client) {
    throw new Error("Client is not defined");
  }
  if (!isAddressValid(address)) {
    throw new Error("Router address is invalid");
  }

  const peer = await readContract(client, {
    abi: hemiEarnRouterAbi,
    address,
    functionName: "peerAddress",
  });

  return getAddress(slice(peer, 12));
};
