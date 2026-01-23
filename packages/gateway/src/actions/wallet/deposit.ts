import {
  type Address,
  type WalletClient,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from "viem";
import { writeContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";

// eslint-disable-next-line complexity
export async function deposit(
  client: WalletClient,
  parameters: {
    address: Address;
    tokenIn: Address;
    amountIn: bigint;
    minPeggedTokenOut: bigint;
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

  // Validate tokenIn address
  if (!parameters.tokenIn || !isAddress(parameters.tokenIn)) {
    throw new Error("Invalid token address");
  }
  if (isAddressEqual(parameters.tokenIn, zeroAddress)) {
    throw new Error("Token address cannot be zero address");
  }

  // Validate receiver address
  if (!parameters.receiver || !isAddress(parameters.receiver)) {
    throw new Error("Invalid receiver address");
  }
  if (isAddressEqual(parameters.receiver, zeroAddress)) {
    throw new Error("Receiver address cannot be zero address");
  }

  // Validate amountIn
  if (typeof parameters.amountIn !== "bigint") {
    throw new Error("Amount must be a bigint");
  }
  if (parameters.amountIn <= 0n) {
    throw new Error("Amount must be greater than 0");
  }

  // Validate minPeggedTokenOut
  if (typeof parameters.minPeggedTokenOut !== "bigint") {
    throw new Error("Minimum output must be a bigint");
  }
  if (parameters.minPeggedTokenOut < 0n) {
    throw new Error("Minimum output cannot be negative");
  }

  return writeContract(client, {
    abi: gatewayAbi,
    account: client.account,
    address: parameters.address,
    args: [
      parameters.tokenIn,
      parameters.amountIn,
      parameters.minPeggedTokenOut,
      parameters.receiver,
    ],
    chain: client.chain,
    functionName: "deposit",
  });
}
