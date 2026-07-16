import { startAnvilFork } from "@hemilabs/anvil-fork-setup";
import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { mainnet } from "viem/chains";

import { fundAccount } from "./fundAccount.ts";

const webRoot = fileURLToPath(new URL("..", import.meta.url));

// Vite only loads env files for the app; plain Node needs them loaded here.
// loadEnvFile never overrides, so precedence is shell > .env.local > .env.
const envLocal = new URL("../.env.local", import.meta.url);
if (existsSync(envLocal)) {
  process.loadEnvFile(envLocal);
}
process.loadEnvFile(new URL("../.env", import.meta.url));

// The app and the dev wallet both read VITE_RPC_URL_MAINNET; vars set here
// win because Vite never overwrites env vars inherited from the process.
const startViteServer = (forkUrl: string): ChildProcess =>
  spawn("pnpm", ["exec", "vite"], {
    cwd: webRoot,
    env: {
      ...process.env,
      VITE_DEV_WALLET: "true",
      VITE_RPC_URL_MAINNET: forkUrl,
    },
    stdio: "inherit",
  });

const { stop, url } = await startAnvilFork({
  chainId: mainnet.id,
  forkUrl: process.env.VITE_RPC_URL_MAINNET ?? mainnet.rpcUrls.default.http[0],
});

// Fund only — scenario state (cooldown, redeem delay, time jumps, …) is
// applied on demand: node web/scripts/<primitive>.ts against the live fork.
try {
  await fundAccount({ address: TEST_ADDRESS, forkUrl: url });
} catch (error) {
  await stop();
  throw error;
}

console.log(`\nFork funded at ${url} — starting the dev server…`);
console.log("The browser auto-connects the dev wallet. Ctrl-C to stop.\n");

const vite = startViteServer(url);

async function teardown() {
  vite.kill("SIGTERM");
  await stop();
}

// Memoised: the vite exit handler must await the same in-flight stop(), or
// its process.exit() would orphan anvil on 8545.
let shutdownPromise: Promise<void> | undefined;
function shutdown() {
  shutdownPromise ??= teardown();
  return shutdownPromise;
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
vite.on("exit", function (code) {
  void shutdown().then(() => process.exit(code ?? 0));
});
