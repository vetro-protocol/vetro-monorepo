import {
  getCooldownEnabled,
  getInstantWithdrawWhitelist,
} from "@vetro-protocol/earn/actions";
import { type Address, type Client } from "viem";

export async function canInstantWithdraw({
  account,
  client,
  stakingVault,
}: {
  account: Address;
  client: Client;
  stakingVault: Address;
}) {
  const cooldownEnabled = await getCooldownEnabled(client, {
    address: stakingVault,
  });
  if (!cooldownEnabled) {
    return true;
  }
  return getInstantWithdrawWhitelist(client, {
    account,
    address: stakingVault,
  });
}
