import {
  getCanEntry,
  getEntryGate,
} from "@vetro-protocol/target-yield-earn/actions";
import { type Address, type Client, isAddressEqual, zeroAddress } from "viem";

export async function fetchCanEntry({
  client,
  owner,
  stakingVaultAddress,
}: {
  client: Client;
  owner: Address;
  stakingVaultAddress: Address;
}) {
  const entryGate = await getEntryGate(client, {
    address: stakingVaultAddress,
  });

  if (isAddressEqual(entryGate, zeroAddress)) {
    return true;
  }

  return getCanEntry(client, {
    address: entryGate,
    owner,
    vault: stakingVaultAddress,
  });
}
