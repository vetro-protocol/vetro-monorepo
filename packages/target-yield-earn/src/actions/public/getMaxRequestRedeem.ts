import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { targetYieldEarnVaultAbi } from "../../abi/targetYieldEarnVaultAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function getMaxRequestRedeem(
  client: Client,
  parameters: {
    address: Address;
    owner: Address;
  },
) {
  if (!client) {
    throw new Error("Client is not defined");
  }

  if (!parameters) {
    throw new Error("Parameters are required");
  }

  if (!isAddressValid(parameters.address)) {
    throw new Error("Vault address is invalid");
  }

  if (!isAddressValid(parameters.owner)) {
    throw new Error("Owner address is invalid");
  }

  return readContract(client, {
    abi: targetYieldEarnVaultAbi,
    address: parameters.address,
    args: [parameters.owner],
    functionName: "maxRequestRedeem",
  });
}
