import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  type Address,
  createPublicClient,
  createTestClient,
  http,
  isAddress,
  parseEther,
} from "viem";
import {
  impersonateAccount,
  readContract,
  setBalance,
  stopImpersonatingAccount,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";

import { stakingVaultAbi } from "../../packages/earn/src/abi/stakingVaultAbi.ts";
import { sVusdAddress } from "../../packages/earn/src/stakingVaultAddresses.ts";

// The StakingVault is Ownable2Step, so its owner-only setters can be called
// directly after impersonating owner() — no role grant needed (unlike the
// gateway's instant-redeem whitelist, which is gated behind MAINTAINER_ROLE).

export async function whitelistInstantWithdraw({
  address,
  forkUrl = "http://127.0.0.1:8545",
  vaultAddress = sVusdAddress,
}: {
  address: Address;
  forkUrl?: string;
  vaultAddress?: Address;
}) {
  const transport = http(forkUrl);

  const publicClient = createPublicClient({ chain: mainnet, transport });
  const testClient = createTestClient({
    chain: mainnet,
    mode: "anvil",
    transport,
  });

  const [owner, isWhitelisted] = await Promise.all([
    readContract(publicClient, {
      abi: stakingVaultAbi,
      address: vaultAddress,
      functionName: "owner",
    }),
    readContract(publicClient, {
      abi: stakingVaultAbi,
      address: vaultAddress,
      args: [address],
      functionName: "instantWithdrawWhitelist",
    }),
  ]);

  if (isWhitelisted) {
    console.log(`${address} is already whitelisted for instant withdraw.`);
    return;
  }

  await impersonateAccount(testClient, { address: owner });
  await setBalance(testClient, { address: owner, value: parseEther("1") });

  try {
    // Enable cooldown so the non-whitelisted path is genuinely multi-step;
    // this makes the whitelisted one-step path deterministic regardless of the
    // fork's current cooldownEnabled state.
    const enableHash = await writeContract(testClient, {
      abi: stakingVaultAbi,
      account: owner,
      address: vaultAddress,
      args: [true],
      functionName: "updateCooldownEnabled",
    });
    await waitForTransactionReceipt(publicClient, { hash: enableHash });

    const whitelistHash = await writeContract(testClient, {
      abi: stakingVaultAbi,
      account: owner,
      address: vaultAddress,
      args: [address, true],
      functionName: "updateInstantWithdrawWhitelist",
    });
    await waitForTransactionReceipt(publicClient, { hash: whitelistHash });
  } finally {
    await stopImpersonatingAccount(testClient, { address: owner });
  }

  console.log(
    `${address} whitelisted for instant withdraw on vault ${vaultAddress}.`,
  );
}

// Allow running as a standalone script for consumers:
//   node web/scripts/whitelistInstantWithdraw.ts --address 0x… [--fork-url …] [--vault …]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      address: { short: "a", type: "string" },
      "fork-url": { short: "f", type: "string" },
      vault: { short: "v", type: "string" },
    },
    strict: true,
  });

  if (values.vault && !isAddress(values.vault, { strict: false })) {
    console.error("Invalid --vault. Must be a valid address.");
    process.exit(1);
  }

  if (!values.address || !isAddress(values.address, { strict: false })) {
    console.error(
      "Address is invalid. Usage: node web/scripts/whitelistInstantWithdraw.ts --address 0xYourAddress",
    );
    process.exit(1);
  }

  await whitelistInstantWithdraw({
    address: values.address,
    forkUrl: values["fork-url"],
    vaultAddress: (values.vault as Address) ?? sVusdAddress,
  });
}
