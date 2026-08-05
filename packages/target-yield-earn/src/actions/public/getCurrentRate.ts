import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { targetYieldEarnVaultAbi } from "../../abi/targetYieldEarnVaultAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function getCurrentRate(
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

  // Validate vault address
  if (!isAddressValid(parameters.address)) {
    throw new Error("Vault address is invalid");
  }

  return readContract(client, {
    abi: targetYieldEarnVaultAbi,
    address: parameters.address,
    functionName: "currentRate",
  });
}
