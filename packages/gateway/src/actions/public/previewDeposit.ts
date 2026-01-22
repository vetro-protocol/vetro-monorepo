import {
  type Address,
  type Client,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from "viem";
import { readContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";

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

  // Validate gateway address
  if (!parameters.address || !isAddress(parameters.address)) {
    throw new Error("Invalid gateway address");
  }
  if (isAddressEqual(parameters.address, zeroAddress)) {
    throw new Error("Gateway address cannot be zero address");
  }

  // Validate tokenIn address
  if (!parameters.tokenIn || !isAddress(parameters.tokenIn)) {
    throw new Error("Invalid token address");
  }
  if (isAddressEqual(parameters.tokenIn, zeroAddress)) {
    throw new Error("Token address cannot be zero address");
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
