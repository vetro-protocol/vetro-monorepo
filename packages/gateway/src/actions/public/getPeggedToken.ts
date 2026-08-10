import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.ts";

export async function getPeggedToken(
  client: Client,
  parameters: {
    address: Address;
  },
) {
  // Validate client
  if (!client) {
    throw new Error("Client is not defined");
  }

  // Validate parameters exist
  if (!parameters) {
    throw new Error("Parameters are required");
  }

  // Validate gateway address
  if (!isAddressValid(parameters.address)) {
    throw new Error("Gateway is invalid");
  }

  return readContract(client, {
    abi: gatewayAbi,
    address: parameters.address,
    functionName: "PEGGED_TOKEN",
  });
}
