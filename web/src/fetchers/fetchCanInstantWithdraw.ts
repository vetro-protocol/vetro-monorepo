import {
  getCooldownEnabled,
  getInstantWithdrawWhitelist,
} from "@vetro-protocol/earn/actions";
import type { Address, Client } from "viem";

export const fetchCanInstantWithdraw = async function ({
  account,
  client,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  client: Client;
  stakingVaultAddress: Address;
}) {
  const cooldownEnabled = await getCooldownEnabled(client, {
    address: stakingVaultAddress,
  });

  if (!cooldownEnabled) {
    return true;
  }

  if (!account) {
    return false;
  }

  return getInstantWithdrawWhitelist(client, {
    account,
    address: stakingVaultAddress,
  });
};
