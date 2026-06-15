import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { expect } from "@playwright/test";
import { createPublicClient, http, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import { balanceOf } from "viem-erc20/actions";

import { knownTokens } from "../src/utils/tokenList.ts";

import { ANVIL_URL } from "./anvil";
import { test } from "./fixtures/wallet";

function getMainnetToken(symbol: string) {
  const token = knownTokens.find(
    (t) => t.chainId === mainnet.id && t.symbol === symbol,
  );
  if (!token) {
    throw new Error(`Token ${symbol} not found in tokenList for mainnet`);
  }
  return token;
}

const usdc = getMainnetToken("USDC");
const vusd = getMainnetToken("VUSD");
const SWAP_AMOUNT_DISPLAY = "1";
const SWAP_AMOUNT = parseUnits(SWAP_AMOUNT_DISPLAY, usdc.decimals);

test("swap USDC → VUSD via the gateway", async function ({ page }) {
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(ANVIL_URL),
  });

  const [usdcBefore, vusdBefore] = await Promise.all([
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: usdc.address,
    }),
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vusd.address,
    }),
  ]);

  await page.goto("/swap");

  // Two "Connect wallet" buttons: header trigger + form submit (disabled).
  await page
    .getByRole("button", { name: /connect wallet/i })
    .first()
    .click();

  // The mock wallet announces EIP-6963 with rdns "com.example.mock-wallet".
  // The modal occasionally re-renders as new providers announce, so click
  // with force to bypass the stability check.
  await page
    .getByTestId("rk-wallet-option-com.example.mock-wallet")
    .click({ force: true });

  // Header button switches from "Connect wallet" to a 0x… short address.
  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  // Pick USDC as the input token. The trigger opens a modal dialog where
  // tokens are listed as buttons (pinned grid + rows), not ARIA options.
  await page
    .getByRole("button", { name: "Select token to swap" })
    .first()
    .click();
  const tokenDialog = page.getByRole("dialog");
  // The modal fades in via an opacity transition. Playwright's visibility
  // check ignores opacity, so it would otherwise click a token mid-animation
  // and race the open/close state, leaving the modal stuck open and blocking
  // the Swap click. Wait for the entrance to finish before selecting.
  await expect(tokenDialog).toHaveCSS("opacity", "1");
  await tokenDialog.getByRole("button", { name: /USDC/ }).first().click();
  // Ensure the modal is gone before interacting with the form underneath.
  await expect(tokenDialog).toBeHidden();

  await page
    .locator('input[type="text"]:not([disabled])')
    .first()
    .fill(SWAP_AMOUNT_DISPLAY);

  await page.getByRole("button", { name: /^swap$/i }).click();

  // The success toast renders once the deposit tx is confirmed on the fork.
  await expect(page.getByText("Deposit confirmed")).toBeVisible({
    timeout: 40_000,
  });

  // No popups — the mock wallet signs and forwards to Anvil silently.
  // Assert by polling balances directly against the fork.
  await expect
    .poll(
      async () =>
        balanceOf(publicClient, {
          account: TEST_ADDRESS,
          address: vusd.address,
        }),
      { timeout: 20_000 },
    )
    .toBeGreaterThan(vusdBefore);

  const usdcAfter = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: usdc.address,
  });
  expect(usdcAfter).toBe(usdcBefore - SWAP_AMOUNT);
});
