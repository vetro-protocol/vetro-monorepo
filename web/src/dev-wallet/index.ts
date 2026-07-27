import { TEST_PRIVATE_KEY } from "@hemilabs/anvil-fork-setup/utils";
import {
  MOCK_WALLET_INFO,
  announceEip6963Provider,
  createMockWalletProvider,
} from "@vetro-protocol/mock-wallet";
import { http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { mainnet } from "../networks/mainnet";

// Defence in depth: main.tsx's DEV guard already strips this module from
// production bundles; the throw makes a mistaken prod import loud.
if (import.meta.env.PROD) {
  throw new Error("dev-wallet must never be imported in a production build");
}

// The interactive counterpart to E2E's installMockWallet: a headless,
// auto-signing EIP-6963 wallet as Anvil account #0 (the one the seed scripts
// fund). Its transport rides the app's mainnet chain config, so writes hit
// whatever VITE_RPC_URL_MAINNET points at — the fork under `dev:fork`.
export function installDevWallet() {
  const { request } = createMockWalletProvider({
    account: privateKeyToAccount(TEST_PRIVATE_KEY),
    chain: mainnet,
    transports: { [mainnet.id]: http() },
  });

  announceEip6963Provider({
    info: MOCK_WALLET_INFO,
    provider: { on() {}, removeListener() {}, request },
  });
}
