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
// directly after impersonating owner() — no role grant needed (see
// whitelistInstantWithdraw.ts). Enabling cooldown WITHOUT whitelisting forces
// the non-instant, two-step withdraw path (request → cooldown → claim): the app
// treats everyone as instant when cooldown is disabled (fetchCanInstantWithdraw),
// so the exit-tickets flow is only reachable with cooldown on.
export async function setCooldownEnabled({
  forkUrl = "http://127.0.0.1:8545",
  vaultAddress = sVusdAddress,
}: {
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

  const owner = await readContract(publicClient, {
    abi: stakingVaultAbi,
    address: vaultAddress,
    functionName: "owner",
  });

  await impersonateAccount(testClient, { address: owner });
  await setBalance(testClient, { address: owner, value: parseEther("1") });

  try {
    const enableHash = await writeContract(testClient, {
      abi: stakingVaultAbi,
      account: owner,
      address: vaultAddress,
      args: [true],
      functionName: "updateCooldownEnabled",
    });
    await waitForTransactionReceipt(publicClient, { hash: enableHash });
  } finally {
    await stopImpersonatingAccount(testClient, { address: owner });
  }

  console.log(`Cooldown enabled on vault ${vaultAddress}.`);
}

// Allow running as a standalone script for consumers:
//   node web/scripts/setCooldownEnabled.ts [--fork-url …] [--vault …]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: {
      "fork-url": { short: "f", type: "string" },
      vault: { short: "v", type: "string" },
    },
    strict: true,
  });

  if (values.vault && !isAddress(values.vault, { strict: false })) {
    console.error("Invalid --vault. Must be a valid address.");
    process.exit(1);
  }

  await setCooldownEnabled({
    forkUrl: values["fork-url"],
    vaultAddress: (values.vault as Address) ?? sVusdAddress,
  });
}
