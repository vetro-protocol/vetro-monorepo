import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function getMaxWithdraw(
  client: Client,
  parameters: {
    address: Address;
    tokenOut: Address;
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

  // Validate tokenOut address
  if (!isAddressValid(parameters.tokenOut)) {
    throw new Error("Token is invalid");
  }

  return readContract(client, {
    abi: gatewayAbi,
    address: parameters.address,
    args: [parameters.tokenOut],
    functionName: "maxWithdraw",
  });
}
