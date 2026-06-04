import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { peggedTokenAbi } from "../../abi/peggedTokenAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

/**
 * Reads the gateway address for a given pegged token.
 * @param client - The viem client used to read the contract.
 * @param parameters - The parameters object.
 * @param parameters.address - The pegged token address to read the gateway from.
 * @returns The gateway address configured on the pegged token.
 */
export async function getGateway(
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

  // Validate pegged token address
  if (!isAddressValid(parameters.address)) {
    throw new Error("Pegged token is invalid");
  }

  return readContract(client, {
    abi: peggedTokenAbi,
    address: parameters.address,
    functionName: "gateway",
  });
}
