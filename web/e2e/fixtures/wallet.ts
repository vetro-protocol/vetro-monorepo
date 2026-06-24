import { TEST_PRIVATE_KEY } from "@hemilabs/anvil-fork-setup/utils";
import { test as base } from "@playwright/test";
import { installMockWallet } from "@vetro-protocol/mock-wallet";
import {
  type EIP1193RequestFn,
  type Hex,
  type Transport,
  createTestClient,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { revert, snapshot } from "viem/actions";
import { mainnet } from "viem/chains";

import { ANVIL_URL } from "../anvil";

// An http transport that records the hash returned by every
// eth_sendRawTransaction it forwards. The mock wallet executes writes in Node
// (installMockWallet runs the wallet client behind page.exposeFunction), so the
// browser never makes this call and Playwright page routing can't observe it —
// tapping the wallet's own transport is the reliable way to learn which tx it
// sent. Reads (eth_call, eth_getLogs, …) pass through untouched.
function recordingTransport(txHashes: Hex[]): Transport {
  const inner = http(ANVIL_URL);
  return function recording(params) {
    const transport = inner(params);
    const request = async function (args: Parameters<EIP1193RequestFn>[0]) {
      const result = await transport.request(args);
      if (args.method === "eth_sendRawTransaction") {
        txHashes.push(result as Hex);
      }
      return result;
    };
    return { ...transport, request: request as EIP1193RequestFn };
  };
}

type WalletFixtures = {
  // Hashes of the txs the mock wallet sent during the test, oldest first.
  walletTxHashes: Hex[];
};

// `installMockWallet` injects an EIP-6963-announcing EIP-1193 provider into
// the page before the dApp scripts run. RainbowKit then sees the wallet via
// EIP-6963 and connects silently — no extension popup, no confirm clicks.
export const test = base.extend<WalletFixtures>({
  async page({ page, walletTxHashes }, use) {
    await installMockWallet({
      account: privateKeyToAccount(TEST_PRIVATE_KEY),
      chain: mainnet,
      page,
      transports: { [mainnet.id]: recordingTransport(walletTxHashes) },
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
  // Playwright requires the first fixture arg to be a destructuring pattern even
  // when the fixture has no dependencies, so the empty pattern is intentional.
  // eslint-disable-next-line no-empty-pattern
  async walletTxHashes({}, use) {
    await use([]);
  },
});
