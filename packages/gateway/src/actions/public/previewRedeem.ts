import {
  type Address,
  type Client,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from "viem";
import { readContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";

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

  // Validate gateway address
  if (!parameters.address || !isAddress(parameters.address)) {
    throw new Error("Invalid gateway address");
  }
  if (isAddressEqual(parameters.address, zeroAddress)) {
    throw new Error("Gateway address cannot be zero address");
  }

  // Validate tokenOut address
  if (!parameters.tokenOut || !isAddress(parameters.tokenOut)) {
    throw new Error("Invalid token address");
  }
  if (isAddressEqual(parameters.tokenOut, zeroAddress)) {
    throw new Error("Token address cannot be zero address");
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
