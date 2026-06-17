import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { expect } from "@playwright/test";
import { createPublicClient, http, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import { balanceOf } from "viem-erc20/actions";

import { gatewayAddresses } from "../../packages/gateway/src/gatewayAddresses.ts";
import { whitelistInstantRedeem } from "../scripts/whitelistInstantRedeem.ts";
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

// The redeem burns VUSD (the pegged token), so the amount is measured in VUSD
// decimals — not USDC's like the deposit above.
const REDEEM_AMOUNT_DISPLAY = "2";
const REDEEM_AMOUNT = parseUnits(REDEEM_AMOUNT_DISPLAY, vusd.decimals);

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

  // Pick USDC as the input token. The default input is whitelistedTokens[0],
  // whose ordering isn't guaranteed (anvil forks at the latest block, so the
  // set/order can differ between local and CI). Selecting any token closes the
  // picker, so we can unconditionally open it and pick USDC — re-selecting it
  // when it's already the default is a harmless no-op that still closes.
  const fromTokenSelector = page
    .getByRole("button", { name: "Select token to swap" })
    .first();
  await fromTokenSelector.click();

  // Wait for the picker to actually open before clicking inside it.
  const fromTokenDialog = page.getByRole("dialog", { name: "Select a token" });
  await expect(fromTokenDialog).toBeVisible();

  // Auto-waits for the USDC row, covering the CI race where the token list is
  // still loading when the dialog opens.
  await fromTokenDialog.getByRole("button", { name: /USDC/ }).first().click();

  await expect(fromTokenSelector).toContainText("USDC");
  // Selecting a token closes the picker; ensure it's gone before interacting
  // with the form underneath.
  await expect(fromTokenDialog).toBeHidden();

  await page
    .locator('input[type="text"]:not([disabled])')
    .first()
    .fill(SWAP_AMOUNT_DISPLAY);

  await page.getByRole("button", { name: /^swap$/i }).click();

  // The success toast renders once the deposit tx is confirmed on the fork.
  await expect(page.getByText("Swap successful")).toBeVisible({
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

test("redeem VUSD → USDC via the gateway (instant redeem)", async function ({
  page,
}) {
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(ANVIL_URL),
  });

  // Whitelist the test account for instant redeem so the redeem takes the
  // one-step path (otherwise the gateway's withdrawal delay forces the
  // two-step queue flow).
  await whitelistInstantRedeem({
    address: TEST_ADDRESS,
    forkUrl: ANVIL_URL,
    gateway: gatewayAddresses[0],
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

  // Wait for the real form to render before toggling. While the whitelisted /
  // pegged token queries are in flight, SwapForm shows SwapFormSkeleton, which
  // renders a "Toggle swap direction" button with no onClick — clicking it is a
  // no-op and the mode never lands in the URL. The "Select token to swap"
  // button only exists in the loaded form (the skeleton uses a non-interactive
  // token selector), so it's a reliable "form is interactive" signal.
  await expect(
    page.getByRole("button", { name: "Select token to swap" }).first(),
  ).toBeVisible();

  // Toggle to redeem BEFORE connecting. Connecting triggers a background
  // refetch that can briefly remount the form (SwapFormSkeleton) and drop the
  // toggle, since the mode lives in the URL (nuqs) and re-inits on remount.
  // Doing it first — and waiting for the mode to land in the URL — means the
  // remount re-initialises in redeem mode rather than reverting to deposit.
  await page.getByRole("button", { name: "Toggle swap direction" }).click();
  await expect(page).toHaveURL(/[?&]mode=redeem/);

  // The mock wallet auto-connects silently via EIP-6963 (see fixtures/wallet),
  // so no connect clicks are needed here — just wait for the header button to
  // switch from "Connect wallet" to the 0x… short address.
  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  // Once connected and whitelisted, the redeem renders the instant one-step
  // form with a selectable output token. Pick USDC unless it's already the
  // default output (clicking the already-selected token won't close the
  // modal). Scope to the "You will receive" section to avoid depending on the
  // relative ordering of the two token selectors.
  const toTokenSelector = page
    .getByText("You will receive")
    .locator("..")
    .getByRole("button", { name: "Select token to swap" });
  await expect(toTokenSelector).toBeVisible();
  // Switch the output to USDC. Selecting any token closes the picker, so we can
  // unconditionally open it and pick USDC — re-selecting it when it's already
  // the default is a harmless no-op that still closes.
  await toTokenSelector.click();

  // Wait for the picker to actually open before clicking inside it.
  const toTokenDialog = page.getByRole("dialog", { name: "Select a token" });
  await expect(toTokenDialog).toBeVisible();

  // Auto-waits for the USDC row, covering the CI race where the token list is
  // still loading when the dialog opens.
  await toTokenDialog.getByRole("button", { name: /USDC/ }).first().click();

  await expect(toTokenSelector).toContainText("USDC");
  // Selecting a token closes the picker; ensure it's gone before interacting
  // with the form underneath.
  await expect(toTokenDialog).toBeHidden();

  await page
    .locator('input[type="text"]:not([disabled])')
    .first()
    .fill(REDEEM_AMOUNT_DISPLAY);

  await page.getByRole("button", { name: /^redeem$/i }).click();
  // The instant one-step redeem path shows the shared swap success toast.
  await expect(page.getByText("Swap successful")).toBeVisible({
    timeout: 40_000,
  });

  // No popups — the mock wallet signs and forwards to Anvil silently.
  // Assert by polling balances directly against the fork.
  await expect
    .poll(
      async () =>
        balanceOf(publicClient, {
          account: TEST_ADDRESS,
          address: usdc.address,
        }),
      { timeout: 20_000 },
    )
    .toBeGreaterThan(usdcBefore);

  const vusdAfter = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: vusd.address,
  });
  expect(vusdAfter).toBe(vusdBefore - REDEEM_AMOUNT);
});
