import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function previewDeposit(
  client: Client,
  parameters: {
    address: Address;
    tokenIn: Address;
    amountIn: bigint;
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

  // Validate tokenIn address
  if (!isAddressValid(parameters.tokenIn)) {
    throw new Error("Token is invalid");
  }

  // Validate amountIn
  if (typeof parameters.amountIn !== "bigint") {
    throw new Error("Amount must be a bigint");
  }
  if (parameters.amountIn <= 0n) {
    throw new Error("Amount must be greater than 0");
  }

  return readContract(client, {
    abi: gatewayAbi,
    address: parameters.address,
    args: [parameters.tokenIn, parameters.amountIn],
    functionName: "previewDeposit",
  });
}
