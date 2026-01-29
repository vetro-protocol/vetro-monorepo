import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function isInstantRedeemWhitelisted(
  client: Client,
  parameters: {
    address: Address;
    account: Address;
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

  // Validate account address
  if (!isAddressValid(parameters.account)) {
    throw new Error("Account is invalid");
  }

  return readContract(client, {
    abi: gatewayAbi,
    address: parameters.address,
    args: [parameters.account],
    functionName: "isInstantRedeemWhitelisted",
  });
}
