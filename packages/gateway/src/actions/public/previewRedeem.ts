import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function previewRedeem(
  client: Client,
  parameters: {
    address: Address;
    tokenOut: Address;
    peggedTokenIn: bigint;
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

  // Validate peggedTokenIn
  if (typeof parameters.peggedTokenIn !== "bigint") {
    throw new Error("Amount must be a bigint");
  }
  if (parameters.peggedTokenIn <= 0n) {
    throw new Error("Amount must be greater than 0");
  }

  return readContract(client, {
    abi: gatewayAbi,
    address: parameters.address,
    args: [parameters.tokenOut, parameters.peggedTokenIn],
    functionName: "previewRedeem",
  });
}
