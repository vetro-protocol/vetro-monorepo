import { TEST_PRIVATE_KEY } from "@hemilabs/anvil-fork-setup/utils";
import { test as base } from "@playwright/test";
import { installMockWallet } from "@vetro-protocol/mock-wallet";
import { createTestClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { revert, snapshot } from "viem/actions";
import { mainnet } from "viem/chains";

import { ANVIL_URL } from "../anvil";

// `installMockWallet` injects an EIP-6963-announcing EIP-1193 provider into
// the page before the dApp scripts run. RainbowKit then sees the wallet via
// EIP-6963 and connects silently — no extension popup, no confirm clicks.
export const test = base.extend({
  async page({ page }, use) {
    await installMockWallet({
      account: privateKeyToAccount(TEST_PRIVATE_KEY),
      chain: mainnet,
      page,
      transports: { [mainnet.id]: http(ANVIL_URL) },
    });

    // The fork is started and funded once in globalSetup, then shared across
    // every test (workers: 1). Without isolation, on-chain mutations from one
    // test leak into the next — e.g. a redeem leaves the gateway allowance set,
    // so a later run skips the approval tx and the stepper jumps to "completed"
    // with no wallet interaction. Snapshot the funded baseline before the test
    // and revert after, so each test starts from the same chain state.
    // installMockWallet only injects scripts (no chain writes), so the snapshot
    // here still captures the clean funded state.
    const testClient = createTestClient({
      chain: mainnet,
      mode: "anvil",
      transport: http(ANVIL_URL),
    });
    const snapshotId = await snapshot(testClient);
    await use(page);
    await revert(testClient, { id: snapshotId });
  },
});
