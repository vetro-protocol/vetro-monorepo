import { isAddressValid } from "@vetro-protocol/core";
import { type Address, type Client } from "viem";
import { readContract } from "viem/actions";

import { stakingVaultAbi } from "../../abi/stakingVaultAbi.ts";

export async function getTotalAssetsInCooldown(
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
    functionName: "totalAssetsInCooldown",
  });
}
