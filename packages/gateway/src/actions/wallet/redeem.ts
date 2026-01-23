import {
  type Address,
  type WalletClient,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from "viem";
import { writeContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";

export async function redeem(
  client: WalletClient,
  parameters: {
    address: Address;
    tokenOut: Address;
    peggedTokenIn: bigint;
    minAmountOut: bigint;
    receiver: Address;
  },
) {
  // Validate client
  if (!client) {
    throw new Error("Client is not defined");
  }
  // Validate client has required properties
  if (!client.account) {
    throw new Error("Client must have an account");
  }
  if (!client.chain) {
    throw new Error("Client must have a chain");
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

  // Validate tokenOut address
  if (!parameters.tokenOut || !isAddress(parameters.tokenOut)) {
    throw new Error("Invalid token address");
  }
  if (isAddressEqual(parameters.tokenOut, zeroAddress)) {
    throw new Error("Token address cannot be zero address");
  }

  // Validate receiver address
  if (!parameters.receiver || !isAddress(parameters.receiver)) {
    throw new Error("Invalid receiver address");
  }
  if (isAddressEqual(parameters.receiver, zeroAddress)) {
    throw new Error("Receiver address cannot be zero address");
  }

  // Validate peggedTokenIn
  if (typeof parameters.peggedTokenIn !== "bigint") {
    throw new Error("Amount must be a bigint");
  }
  if (parameters.peggedTokenIn <= 0n) {
    throw new Error("Amount must be greater than 0");
  }

  // Validate minAmountOut
  if (typeof parameters.minAmountOut !== "bigint") {
    throw new Error("Minimum output must be a bigint");
  }
  if (parameters.minAmountOut < 0n) {
    throw new Error("Minimum output cannot be negative");
  }

  return writeContract(client, {
    abi: gatewayAbi,
    account: client.account,
    address: parameters.address,
    args: [
      parameters.tokenOut,
      parameters.peggedTokenIn,
      parameters.minAmountOut,
      parameters.receiver,
    ],
    chain: client.chain,
    functionName: "redeem",
  });
}
