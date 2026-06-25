import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { expect } from "@playwright/test";
import { parseUnits } from "viem";
import { getBlock, readContract } from "viem/actions";
import { balanceOf } from "viem-erc20/actions";

import { gatewayAbi } from "../../packages/gateway/src/abi/gatewayAbi.ts";
import { gatewayAddresses } from "../../packages/gateway/src/gatewayAddresses.ts";
import { fastForwardTime } from "../scripts/fastForwardTime.ts";
import { setRedeemDelay } from "../scripts/redeemDelay.ts";
import { whitelistInstantRedeem } from "../scripts/whitelistInstantRedeem.ts";

import { ANVIL_URL, createEthereumClient } from "./anvil";
import { test } from "./fixtures/wallet";
import { getMainnetToken, waitForBalance } from "./helpers";

const usdc = getMainnetToken("USDC");
const vusd = getMainnetToken("VUSD");
const SWAP_AMOUNT_DISPLAY = "1";
const SWAP_AMOUNT = parseUnits(SWAP_AMOUNT_DISPLAY, usdc.decimals);

// The redeem burns VUSD (the pegged token), so the amount is measured in VUSD
// decimals — not USDC's like the deposit above.
const REDEEM_AMOUNT_DISPLAY = "2";
const REDEEM_AMOUNT = parseUnits(REDEEM_AMOUNT_DISPLAY, vusd.decimals);

test("swap USDC → VUSD via the gateway", async function ({ page }) {
  const publicClient = createEthereumClient();

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

  // The mock wallet auto-connects silently via EIP-6963 (see fixtures/wallet),
  // so don't open the RainbowKit connect modal here: useOverlay.handleClose
  // no-ops while connectModalOpen is true, so a stale "connect modal open"
  // state would stop the token picker from closing. Just wait for the header
  // button to switch from "Connect wallet" to the 0x… short address.
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
  await waitForBalance({
    client: publicClient,
    token: vusd.address,
  }).toBeGreaterThan(vusdBefore);

  const usdcAfter = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: usdc.address,
  });
  expect(usdcAfter).toBe(usdcBefore - SWAP_AMOUNT);
});

test("redeem VUSD → USDC via the gateway (instant redeem)", async function ({
  page,
}) {
  const publicClient = createEthereumClient();

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
  await waitForBalance({
    client: publicClient,
    token: usdc.address,
  }).toBeGreaterThan(usdcBefore);

  const vusdAfter = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: vusd.address,
  });
  expect(vusdAfter).toBe(vusdBefore - REDEEM_AMOUNT);
});

test("redeem VUSD via the gateway (two-step queue redeem)", async function ({
  page,
}) {
  const publicClient = createEthereumClient();

  // Enable the gateway's withdrawal delay and ensure the test account is NOT
  // whitelisted for instant redeem, forcing the two-step (request → wait →
  // claim) path. The per-test snapshot/revert already isolates any whitelisting
  // done by the instant-redeem test, but we set this explicitly so the test is
  // self-contained.
  await setRedeemDelay({
    address: TEST_ADDRESS,
    enableDelay: true,
    forkUrl: ANVIL_URL,
    gateway: gatewayAddresses[0],
  });

  const vusdBefore = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: vusd.address,
  });

  await page.goto("/swap");

  // Wait for the interactive form before toggling — the loading skeleton's
  // toggle button is a no-op (see the instant-redeem test for the full
  // rationale).
  await expect(
    page.getByRole("button", { name: "Select token to swap" }).first(),
  ).toBeVisible();

  // Toggle to redeem BEFORE connecting and wait for the mode to land in the URL,
  // so the connect-triggered remount re-initialises in redeem mode.
  await page.getByRole("button", { name: "Toggle swap direction" }).click();
  await expect(page).toHaveURL(/[?&]mode=redeem/);

  // The mock wallet auto-connects silently via EIP-6963 — just wait for the
  // header button to switch to the 0x… short address.
  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  // Step 1 — request redeem. The two-step form has no output-token selector (the
  // output is chosen later in the claim drawer); the input defaults to VUSD.
  await page
    .locator('input[type="text"]:not([disabled])')
    .first()
    .fill(REDEEM_AMOUNT_DISPLAY);

  await page.getByRole("button", { name: /send to queue/i }).click();

  // The toast confirms the VUSD reached the queue (covers approval + request).
  await expect(page.getByText(/sent to queue/i)).toBeVisible({
    timeout: 60_000,
  });

  // The VUSD is now locked in the gateway, so the wallet balance already dropped.
  await waitForBalance({ client: publicClient, token: vusd.address }).toBe(
    vusdBefore - REDEEM_AMOUNT,
  );

  // The queue now lists the request we just created — assert the
  // redeemable-balance column shows the locked amount and pegged-token symbol.
  const redeemQueue = page.locator("#redeem-queue");
  await expect(
    redeemQueue.getByText(`${REDEEM_AMOUNT_DISPLAY} ${vusd.symbol}`),
  ).toBeVisible({ timeout: 20_000 });

  // Skip the cooldown without waiting. Read claimableAt from the fork, then
  // advance BOTH clocks past it:
  //  - the fork's block.timestamp, by fast-forwarding past the cooldown, so the
  //    claim tx passes the contract's `block.timestamp >= claimableAt` check
  //    (Gateway._handleRedeemOrWithdraw),
  //  - the browser clock, so the queue row's Date.now-based countdown
  //    (useCountdown) reaches zero and enables the Redeem button.
  const [, claimableAt] = await readContract(publicClient, {
    abi: gatewayAbi,
    address: gatewayAddresses[0],
    args: [TEST_ADDRESS],
    functionName: "getRedeemRequest",
  });
  // Fail loudly if the request wasn't recorded (claimableAt 0) instead of
  // silently under-advancing the clock below.
  expect(claimableAt).toBeGreaterThan(0n);

  const { timestamp: chainNow } = await getBlock(publicClient);
  // Mirror the fork's actual post-fast-forward timestamp onto the browser clock
  // (rather than re-deriving an estimate) so the on-chain check and the UI
  // countdown stay in sync.
  const newTimestamp = await fastForwardTime({
    forkUrl: ANVIL_URL,
    seconds: Number(claimableAt - chainNow),
  });
  await page.clock.setFixedTime(Number(newTimestamp) * 1000);

  // Step 2 — claim the now-redeemable position from the queue. The cooldown has
  // elapsed, so the row's status flips to "Ready to redeem" and its Redeem
  // button enables.
  await expect(redeemQueue.getByText(/ready to redeem/i)).toBeVisible({
    timeout: 20_000,
  });
  const queueRedeemButton = redeemQueue.getByRole("button", {
    name: /^redeem$/i,
  });
  await expect(queueRedeemButton).toBeEnabled();
  await queueRedeemButton.click();

  // The claim drawer slides in ("Redeem your VUSD"). Scope to it by its title
  // heading's container rather than brittle layout classes — the heading's
  // parent holds the whole drawer body (amount input, token selector, buttons).
  const drawerTitle = page.getByRole("heading", { name: /redeem your/i });
  await expect(drawerTitle).toBeVisible();
  const drawer = drawerTitle.locator("..");

  // Redeem to the drawer's default output token. Switching it via the token
  // modal would dismiss the drawer — the modal renders in its own portal, so the
  // selection click registers as an outside-click for the drawer's
  // click-outside handler — so read which stablecoin the default is and assert
  // against that one.
  const outputSymbol = (
    await drawer
      .getByRole("button", { name: "Select token to swap" })
      .innerText()
  ).trim();
  const outputToken = getMainnetToken(outputSymbol);
  const outputBefore = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: outputToken.address,
  });

  // Redeem the full locked amount.
  await drawer.getByRole("button", { name: "MAX" }).click();
  await drawer.getByRole("button", { name: /^redeem$/i }).click();

  // The claim settled on the fork: the output stablecoin was received, and VUSD
  // stays at its post-step-1 value (the locked balance was burned, not the
  // wallet's).
  await waitForBalance({
    client: publicClient,
    token: outputToken.address,
  }).toBeGreaterThan(outputBefore);

  const vusdAfterClaim = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: vusd.address,
  });
  expect(vusdAfterClaim).toBe(vusdBefore - REDEEM_AMOUNT);
});
