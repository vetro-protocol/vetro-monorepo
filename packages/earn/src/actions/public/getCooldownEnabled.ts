import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { stakingVaultAbi } from "../../abi/stakingVaultAbi.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export async function getCooldownEnabled(
  client: Client,
  parameters: {
    address: Address;
  },
) {
  if (!client) {
    throw new Error("Client is not defined");
  }

  if (!parameters) {
    throw new Error("Parameters are required");
  }

  if (!isAddressValid(parameters.address)) {
    throw new Error("StakingVault address is invalid");
  }

  return readContract(client, {
    abi: stakingVaultAbi,
    address: parameters.address,
    functionName: "cooldownEnabled",
  });
}
