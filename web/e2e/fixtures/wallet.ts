import { TEST_PRIVATE_KEY } from "@hemilabs/anvil-fork-setup/utils";
import { test as base } from "@playwright/test";
import { installMockWallet } from "@vetro-protocol/mock-wallet";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
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
    await use(page);
  },
});
