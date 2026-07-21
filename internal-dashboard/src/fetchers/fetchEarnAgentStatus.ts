import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { getPendingRequests } from "@vetro-protocol/earn/actions";
import { type Address, type Hex, getAddress } from "viem";
import { getStorageAt, readContract } from "viem/actions";
import { decimals, symbol } from "viem-erc20/actions";
import { asset } from "viem-erc4626/actions";

import {
  earnAgentAbi,
  earnAgentAddress,
  erc1967AdminSlot,
  erc1967ImplementationSlot,
} from "../config/earnAgent";
import { client } from "../lib/client";
import { type CooldownRequest } from "../lib/cooldownSummary";
import { normalizeAddress } from "../lib/format";

export type VaultCooldownPosition = {
  address: Address;
  requests: CooldownRequest[];
  symbol: string;
  underlying: { decimals: number; symbol: string };
};

type EarnAgentStatus = {
  implementation: Address | undefined;
  keepers: Address[];
  owner: Address;
  pendingOwner: Address | undefined;
  proxyAdmin: Address | undefined;
  vaults: VaultCooldownPosition[];
};

// An ERC-1967 slot holds the address right-aligned in 32 bytes; an unset slot
// comes back as zero (or "0x" from some RPCs), which normalizes to undefined.
const slotToAddress = (slotValue: Hex | undefined) =>
  normalizeAddress(slotValue ? `0x${slotValue.slice(-40)}` : undefined);

const agentContract = {
  abi: earnAgentAbi,
  address: earnAgentAddress,
} as const;

const fetchVaultCooldownPosition = async function (vaultAddress: Address) {
  const address = getAddress(vaultAddress);
  const [[requestIds, assets, claimableAt], vaultSymbol, assetAddress] =
    await Promise.all([
      getPendingRequests(client, { account: earnAgentAddress, address }),
      symbol(client, { address }),
      asset(client, { address }),
    ]);
  const [underlyingDecimals, underlyingSymbol] = await Promise.all([
    decimals(client, { address: assetAddress }),
    symbol(client, { address: assetAddress }),
  ]);
  return {
    address,
    requests: requestIds.map((requestId, index) => ({
      assets: assets[index],
      claimableAt: claimableAt[index],
      requestId,
    })),
    symbol: vaultSymbol,
    underlying: { decimals: underlyingDecimals, symbol: underlyingSymbol },
  } satisfies VaultCooldownPosition;
};

export const fetchEarnAgentStatus = async function () {
  const [keepers, owner, pendingOwner, implementationSlot, adminSlot, vaults] =
    await Promise.all([
      readContract(client, { ...agentContract, functionName: "getKeepers" }),
      readContract(client, { ...agentContract, functionName: "owner" }),
      readContract(client, { ...agentContract, functionName: "pendingOwner" }),
      getStorageAt(client, {
        address: earnAgentAddress,
        slot: erc1967ImplementationSlot,
      }),
      getStorageAt(client, {
        address: earnAgentAddress,
        slot: erc1967AdminSlot,
      }),
      Promise.all(stakingVaultAddresses.map(fetchVaultCooldownPosition)),
    ]);

  return {
    implementation: slotToAddress(implementationSlot),
    keepers: keepers.map((keeper) => getAddress(keeper)),
    owner: getAddress(owner),
    pendingOwner: normalizeAddress(pendingOwner),
    proxyAdmin: slotToAddress(adminSlot),
    vaults,
  } satisfies EarnAgentStatus;
};
