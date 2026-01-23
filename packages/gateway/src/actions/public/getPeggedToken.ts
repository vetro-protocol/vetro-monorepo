import {
  type Address,
  type Client,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from "viem";
import { readContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";

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
  if (!parameters.address || !isAddress(parameters.address)) {
    throw new Error("Invalid gateway address");
  }
  if (isAddressEqual(parameters.address, zeroAddress)) {
    throw new Error("Gateway address cannot be zero address");
  }

  return readContract(client, {
    abi: gatewayAbi,
    address: parameters.address,
    functionName: "PEGGED_TOKEN",
  });
}
