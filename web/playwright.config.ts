import { defineConfig } from "@playwright/test";

import { ANVIL_URL } from "./e2e/anvil";

// Distinct from the default 5173 so a developer's running `pnpm dev` doesn't
// get reused with the wrong env (we need VITE_RPC_URL_MAINNET pointing at the
// fork, which only takes effect when Playwright spawns Vite itself).
const PORT = 5174;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  fullyParallel: false,
  globalSetup: "./e2e/global-setup.ts",
  // Locally the HTML report auto-opens on failure; on CI it never opens
  // (failures are already printed to the console by the list reporter).
  reporter: [
    ["list"],
    ["github"],
    ["html", { open: process.env.CI ? "never" : "on-failure" }],
  ],
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts$/,
  timeout: 120_000,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    env: {
      // Swap/redeem is fully on-chain; the backend APIs only supply USD display
      // values. Disable them so e2e stays hermetic (prices render as $0, which
      // these tests don't assert on). isValidUrl("") is false → query disabled.
      VITE_PORTAL_API_URL: "",
      VITE_RPC_URL_MAINNET: ANVIL_URL,
      VITE_VETRO_API_URL: "",
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: BASE_URL,
  },
  workers: 1,
});
