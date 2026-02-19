import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function getRedeemRequest(
  client: Client,
  parameters: {
    address: Address;
    user: Address;
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

  // Validate user address
  if (!isAddressValid(parameters.user)) {
    throw new Error("User is invalid");
  }

  return readContract(client, {
    abi: gatewayAbi,
    address: parameters.address,
    args: [parameters.user],
    functionName: "getRedeemRequest",
  });
}
