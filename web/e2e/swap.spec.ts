import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { type Page, expect } from "@playwright/test";
import { sVusdAddress } from "@vetro-protocol/earn";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import { getRedeemRequest, getTreasury } from "@vetro-protocol/gateway/actions";
import { getWhitelistedTokens } from "@vetro-protocol/treasury/actions";
import {
  type Hex,
  erc20Abi,
  isAddressEqual,
  maxUint256,
  parseAbiItem,
  parseEventLogs,
  parseUnits,
} from "viem";
import {
  getBlock,
  getTransactionReceipt,
  waitForTransactionReceipt,
} from "viem/actions";
import { allowance, approve, balanceOf, symbol } from "viem-erc20/actions";

import { fastForwardTime } from "../scripts/fastForwardTime.ts";
import { setRedeemDelay } from "../scripts/redeemDelay.ts";
import { requestRedeem } from "../scripts/requestRedeem.ts";
import { setDepositActive } from "../scripts/setDepositActive.ts";
import { setMaxMint } from "../scripts/setMaxMint.ts";
import { setWithdrawActive } from "../scripts/setWithdrawActive.ts";
import { whitelistInstantRedeem } from "../scripts/whitelistInstantRedeem.ts";

import {
  ANVIL_URL,
  createEthereumClient,
  createTestWalletClient,
} from "./anvil";
import { test } from "./fixtures/wallet";
import { getMainnetToken, waitForBalance } from "./helpers";

const usdc = getMainnetToken("USDC");
const usdcSymbol = new RegExp(usdc.symbol);
const vusd = getMainnetToken("VUSD");
const SWAP_AMOUNT_DISPLAY = "1";
const SWAP_AMOUNT = parseUnits(SWAP_AMOUNT_DISPLAY, usdc.decimals);

// The redeem burns VUSD (the pegged token), so the amount is measured in VUSD
// decimals — not USDC's like the deposit above.
const REDEEM_AMOUNT_DISPLAY = "2";
const REDEEM_AMOUNT = parseUnits(REDEEM_AMOUNT_DISPLAY, vusd.decimals);

test("swap USDC → VUSD via the gateway", async function ({
  page,
  walletWatchedAssets,
}) {
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
  await fromTokenDialog
    .getByRole("button", { name: usdcSymbol })
    .first()
    .click();

  await expect(fromTokenSelector).toContainText(usdcSymbol);
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

  // Check input resets to "0" on success
  await expect(
    page.locator('input[type="text"]:not([disabled])').first(),
  ).toHaveValue("0", { timeout: 15_000 });

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

  // With stake off, the pegged token is offered to the wallet after the mint.
  await expect
    .poll(() => walletWatchedAssets.map((address) => address.toLowerCase()))
    .toEqual([vusd.address.toLowerCase()]);
});

const depositEvent = parseAbiItem(
  "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)",
);

async function fillUsdcSwap(page: Page) {
  await page.goto("/swap");

  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  const fromTokenSelector = page
    .getByRole("button", { name: "Select token to swap" })
    .first();
  await fromTokenSelector.click();

  const fromTokenDialog = page.getByRole("dialog", { name: "Select a token" });
  await expect(fromTokenDialog).toBeVisible();
  await fromTokenDialog
    .getByRole("button", { name: usdcSymbol })
    .first()
    .click();

  await expect(fromTokenSelector).toContainText(usdcSymbol);
  await expect(fromTokenDialog).toBeHidden();

  await page
    .locator('input[type="text"]:not([disabled])')
    .first()
    .fill(SWAP_AMOUNT_DISPLAY);
}

async function getSwapAndStakeBalances() {
  const publicClient = createEthereumClient();
  const [svusd, usdcBalance, vusdBalance] = await Promise.all(
    [sVusdAddress, usdc.address, vusd.address].map((address) =>
      balanceOf(publicClient, { account: TEST_ADDRESS, address }),
    ),
  );
  return { svusd, usdc: usdcBalance, vusd: vusdBalance };
}

async function getMintedVusd(hash: Hex) {
  const receipt = await getTransactionReceipt(createEthereumClient(), { hash });
  return parseEventLogs({
    abi: erc20Abi,
    args: { to: TEST_ADDRESS },
    eventName: "Transfer",
    logs: receipt.logs,
  })
    .filter((log) => isAddressEqual(log.address, vusd.address))
    .reduce((sum, log) => sum + log.args.value, 0n);
}

async function getStakeDeposit(hash: Hex) {
  const receipt = await getTransactionReceipt(createEthereumClient(), { hash });
  const logs = parseEventLogs({
    abi: [depositEvent],
    args: { owner: TEST_ADDRESS },
    eventName: "Deposit",
    logs: receipt.logs,
  });
  expect(logs).toHaveLength(1);
  return logs[0].args;
}

async function startSwapAndStake({
  approve10x = false,
  page,
}: {
  approve10x?: boolean;
  page: Page;
}) {
  await fillUsdcSwap(page);
  const stakeSwitch = page.getByRole("switch", { name: "Stake after swap" });
  await expect(stakeSwitch).toBeVisible({ timeout: 20_000 });
  await stakeSwitch.click();

  if (approve10x) {
    const approveSwitch = page.getByRole("switch", { name: "Approve 10x" });
    await approveSwitch.click();
  }

  await page.getByRole("button", { name: /^swap and stake$/i }).click();
}

async function expectSwapAndStakeCompleted({
  before,
  mintTxHash,
  page,
  stakeTxHash,
}: {
  before: Awaited<ReturnType<typeof getSwapAndStakeBalances>>;
  mintTxHash: Hex;
  page: Page;
  stakeTxHash: Hex;
}) {
  await expect(
    page.getByRole("heading", { name: "Swap in progress" }),
  ).toBeHidden({ timeout: 15_000 });
  await expect(
    page.locator('input[type="text"]:not([disabled])').first(),
  ).toHaveValue("0", { timeout: 15_000 });

  const minted = await getMintedVusd(mintTxHash);
  expect(minted).toBeGreaterThan(0n);
  const { assets, shares } = await getStakeDeposit(stakeTxHash);
  expect(assets).toBe(minted);

  const after = await getSwapAndStakeBalances();
  expect(after.svusd - before.svusd).toBe(shares);
  expect(after.vusd).toBe(before.vusd);
  expect(after.usdc).toBe(before.usdc - SWAP_AMOUNT);
}

test("swap USDC → VUSD and stake it, with the stake approval", async function ({
  page,
  walletTxHashes,
  walletWatchedAssets,
}) {
  const before = await getSwapAndStakeBalances();

  await startSwapAndStake({ page });

  await expect(page.getByText("Approve VUSD for staking")).toBeVisible();
  await expect(page.getByText("Stake VUSD", { exact: true })).toBeVisible();

  await expect(page.getByText("Stake deposit confirmed")).toBeVisible({
    timeout: 40_000,
  });

  // USDC approve, mint, VUSD approve, stake.
  expect(walletTxHashes).toHaveLength(4);
  // Like on Earn, only the share token is offered to the wallet, after the stake.
  await expect
    .poll(() => walletWatchedAssets.map((address) => address.toLowerCase()))
    .toEqual([sVusdAddress.toLowerCase()]);
  await expectSwapAndStakeCompleted({
    before,
    mintTxHash: walletTxHashes[1],
    page,
    stakeTxHash: walletTxHashes[3],
  });
});

test("swap USDC → VUSD and stake it, skipping the stake approval when the allowance is enough", async function ({
  page,
  walletTxHashes,
}) {
  const walletClient = createTestWalletClient();
  const approvalHash = await approve(walletClient, {
    address: vusd.address,
    amount: maxUint256,
    spender: sVusdAddress,
  });
  await waitForTransactionReceipt(walletClient, { hash: approvalHash });

  const before = await getSwapAndStakeBalances();

  await startSwapAndStake({ page });

  await expect(page.getByText("Stake VUSD", { exact: true })).toBeVisible();
  await expect(page.getByText("Approve VUSD for staking")).toHaveCount(0);

  await expect(page.getByText("Stake deposit confirmed")).toBeVisible({
    timeout: 40_000,
  });

  // USDC approve, mint, stake.
  expect(walletTxHashes).toHaveLength(3);
  await expectSwapAndStakeCompleted({
    before,
    mintTxHash: walletTxHashes[1],
    page,
    stakeTxHash: walletTxHashes[2],
  });
});

test("a failed stake after the swap keeps the minted VUSD, and Retry stakes it", async function ({
  failTxAt,
  page,
  walletTxHashes,
}) {
  failTxAt.add(2);
  const before = await getSwapAndStakeBalances();

  await startSwapAndStake({ page });

  await expect(page.getByText(/The stake did not complete/)).toBeVisible({
    timeout: 60_000,
  });
  // With stake on, the only toast is the one after the last step.
  await expect(page.getByText("Swap successful")).toHaveCount(0);
  const retryButton = page.getByRole("button", { name: "Retry" });
  await expect(retryButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Swap in progress" }),
  ).toBeVisible();

  expect(walletTxHashes).toHaveLength(2);
  const minted = await getMintedVusd(walletTxHashes[1]);
  const afterFailure = await getSwapAndStakeBalances();
  expect(afterFailure.vusd).toBe(before.vusd + minted);
  expect(afterFailure.svusd).toBe(before.svusd);

  await retryButton.click();

  await expect(page.getByText("Stake deposit confirmed")).toBeVisible({
    timeout: 40_000,
  });

  expect(walletTxHashes).toHaveLength(4);
  await expectSwapAndStakeCompleted({
    before,
    mintTxHash: walletTxHashes[1],
    page,
    stakeTxHash: walletTxHashes[3],
  });
});

test("a failed vault deposit after the stake approval keeps the minted VUSD, and Retry only sends the deposit", async function ({
  failTxAt,
  page,
  walletTxHashes,
}) {
  // Fail the vault deposit, after USDC approve, mint and VUSD approve.
  failTxAt.add(3);
  const before = await getSwapAndStakeBalances();

  await startSwapAndStake({ page });

  await expect(page.getByText(/The stake did not complete/)).toBeVisible({
    timeout: 60_000,
  });
  const retryButton = page.getByRole("button", { name: "Retry" });
  await expect(retryButton).toBeVisible();

  expect(walletTxHashes).toHaveLength(3);
  const minted = await getMintedVusd(walletTxHashes[1]);
  const afterFailure = await getSwapAndStakeBalances();
  expect(afterFailure.vusd).toBe(before.vusd + minted);
  expect(afterFailure.svusd).toBe(before.svusd);

  await retryButton.click();

  await expect(page.getByText("Stake deposit confirmed")).toBeVisible({
    timeout: 40_000,
  });

  // The approval is already on-chain, so the Retry sends only the deposit.
  expect(walletTxHashes).toHaveLength(4);
  await expectSwapAndStakeCompleted({
    before,
    mintTxHash: walletTxHashes[1],
    page,
    stakeTxHash: walletTxHashes[3],
  });
});

test("swap USDC → VUSD and stake it with Approve 10x", async function ({
  page,
  walletTxHashes,
}) {
  const before = await getSwapAndStakeBalances();

  await startSwapAndStake({ approve10x: true, page });

  await expect(page.getByText("Stake deposit confirmed")).toBeVisible({
    timeout: 60_000,
  });

  expect(walletTxHashes).toHaveLength(4);
  await expectSwapAndStakeCompleted({
    before,
    mintTxHash: walletTxHashes[1],
    page,
    stakeTxHash: walletTxHashes[3],
  });

  // The vault approval is 10x the minted amount, and the deposit spends 1x.
  const minted = await getMintedVusd(walletTxHashes[1]);
  const vaultAllowance = await allowance(createEthereumClient(), {
    address: vusd.address,
    owner: TEST_ADDRESS,
    spender: sVusdAddress,
  });
  expect(vaultAllowance).toBe(minted * 10n - minted);
});

test("deposit CTA reads 'Swaps are paused' when the token's deposits are paused", async function ({
  page,
}) {
  const { activeAfter } = await setDepositActive({
    active: false,
    forkUrl: ANVIL_URL,
    gateway: gatewayAddresses[0],
    token: usdc.address,
  });
  expect(activeAfter).toBe(false);

  await page.goto("/swap");

  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  const fromTokenSelector = page
    .getByRole("button", { name: "Select token to swap" })
    .first();
  await fromTokenSelector.click();

  const fromTokenDialog = page.getByRole("dialog", { name: "Select a token" });
  await expect(fromTokenDialog).toBeVisible();
  await fromTokenDialog
    .getByRole("button", { name: usdcSymbol })
    .first()
    .click();

  await expect(fromTokenSelector).toContainText(usdcSymbol);
  await expect(fromTokenDialog).toBeHidden();

  const pausedButton = page.getByRole("button", {
    name: "Swaps are paused for this token",
  });
  await expect(pausedButton).toBeVisible({ timeout: 20_000 });
  await expect(pausedButton).toBeDisabled();

  const resumed = await setDepositActive({
    active: true,
    forkUrl: ANVIL_URL,
    gateway: gatewayAddresses[0],
    token: usdc.address,
  });
  expect(resumed.activeAfter).toBe(true);
});

test("deposit CTA reads 'Amount exceeds mint limit' once the preview exceeds the gateway's remaining capacity", async function ({
  page,
}) {
  const remainingCapacity = parseUnits("0.5", vusd.decimals);
  const { maxMintAfter, maxMintBefore } = await setMaxMint({
    forkUrl: ANVIL_URL,
    gateway: gatewayAddresses[0],
    maxMint: remainingCapacity,
  });
  expect(maxMintAfter).toBe(remainingCapacity);

  await page.goto("/swap");

  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  const fromTokenSelector = page
    .getByRole("button", { name: "Select token to swap" })
    .first();
  await fromTokenSelector.click();

  const fromTokenDialog = page.getByRole("dialog", { name: "Select a token" });
  await expect(fromTokenDialog).toBeVisible();
  await fromTokenDialog
    .getByRole("button", { name: usdcSymbol })
    .first()
    .click();

  await expect(fromTokenSelector).toContainText(usdcSymbol);
  await expect(fromTokenDialog).toBeHidden();

  const amountInput = page
    .locator('input[type="text"]:not([disabled])')
    .first();

  await amountInput.fill("0.1");
  await expect(page.getByRole("button", { name: /^swap$/i })).toBeEnabled({
    timeout: 20_000,
  });

  // Over the cap: 1 USDC previews to ~0.999 VUSD, above the 0.5 remaining.
  await amountInput.fill(SWAP_AMOUNT_DISPLAY);

  const exceededButton = page.getByRole("button", {
    name: "Amount exceeds mint limit",
  });
  await expect(exceededButton).toBeVisible({ timeout: 20_000 });
  await expect(exceededButton).toBeDisabled();

  const restored = await setMaxMint({
    forkUrl: ANVIL_URL,
    gateway: gatewayAddresses[0],
    maxMint: maxMintBefore,
  });
  expect(restored.maxMintAfter).toBe(maxMintBefore);
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
  // relative ordering of the two token selectors. The label sits inside the
  // TokenInput header row, so climb two levels to reach the card that also
  // holds the token selector.
  const toTokenSelector = page
    .getByText("You will receive")
    .locator("../..")
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
  await toTokenDialog.getByRole("button", { name: usdcSymbol }).first().click();

  await expect(toTokenSelector).toContainText(usdcSymbol);
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

  // Check input resets to "0" on success
  await expect(
    page.locator('input[type="text"]:not([disabled])').first(),
  ).toHaveValue("0", { timeout: 15_000 });

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

  // Check input resets to "0" on success
  await expect(
    page.locator('input[type="text"]:not([disabled])').first(),
  ).toHaveValue("0", { timeout: 15_000 });

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
  const [, claimableAt] = await getRedeemRequest(publicClient, {
    address: gatewayAddresses[0],
    user: TEST_ADDRESS,
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

  // The claim drawer slides in ("Redeem your VUSD").
  const drawer = page.getByRole("dialog", { name: /redeem your/i });
  await expect(drawer).toBeVisible();

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

test("claim drawer CTA reads 'Redeems are paused for this token' when the output token's redeems are paused", async function ({
  page,
}) {
  const publicClient = createEthereumClient();

  await setRedeemDelay({
    address: TEST_ADDRESS,
    enableDelay: true,
    forkUrl: ANVIL_URL,
    gateway: gatewayAddresses[0],
  });

  // Queue the redeem on-chain instead of through the form.
  const { claimableAt } = await requestRedeem({
    address: TEST_ADDRESS,
    forkUrl: ANVIL_URL,
    gateway: gatewayAddresses[0],
    peggedTokenAmount: REDEEM_AMOUNT,
  });
  expect(claimableAt).toBeGreaterThan(0n);

  const treasury = await getTreasury(publicClient, {
    address: gatewayAddresses[0],
  });
  const [defaultOutputToken] = await getWhitelistedTokens(publicClient, {
    address: treasury,
  });
  const defaultOutputSymbol = await symbol(publicClient, {
    address: defaultOutputToken,
  });

  const { activeAfter } = await setWithdrawActive({
    active: false,
    forkUrl: ANVIL_URL,
    gateway: gatewayAddresses[0],
    token: defaultOutputToken,
  });
  expect(activeAfter).toBe(false);

  // Skip the cooldown on both clocks — the fork's, so the request is claimable,
  // and the browser's, so the row's countdown (useCountdown) reaches zero and
  // enables the Redeem button. See the two-step test for the full rationale.
  const { timestamp: chainNow } = await getBlock(publicClient);
  const newTimestamp = await fastForwardTime({
    forkUrl: ANVIL_URL,
    seconds: Number(claimableAt - chainNow),
  });
  await page.clock.setFixedTime(Number(newTimestamp) * 1000);

  await page.goto("/swap");

  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  const redeemQueue = page.locator("#redeem-queue");
  await expect(redeemQueue.getByText(/ready to redeem/i)).toBeVisible({
    timeout: 20_000,
  });

  const queueRedeemButton = redeemQueue.getByRole("button", {
    name: /^redeem$/i,
  });
  await expect(queueRedeemButton).toBeEnabled({ timeout: 30_000 });
  await queueRedeemButton.click();

  const drawer = page.getByRole("dialog", { name: /redeem your/i });
  await expect(drawer).toBeVisible();

  await expect(
    drawer.getByRole("button", { name: "Select token to swap" }),
  ).toContainText(defaultOutputSymbol);

  const pausedButton = drawer.getByRole("button", {
    name: "Redeems are paused for this token",
  });
  await expect(pausedButton).toBeVisible({ timeout: 20_000 });
  await expect(pausedButton).toBeDisabled();
});

test("cancel a queued redeem from the redeem queue", async function ({ page }) {
  const publicClient = createEthereumClient();

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

  const { amountLocked, claimableAt } = await requestRedeem({
    address: TEST_ADDRESS,
    forkUrl: ANVIL_URL,
    gateway: gatewayAddresses[0],
    peggedTokenAmount: REDEEM_AMOUNT,
  });
  expect(amountLocked).toBe(REDEEM_AMOUNT);
  expect(claimableAt).toBeGreaterThan(0n);

  expect(
    await balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vusd.address,
    }),
  ).toBe(vusdBefore - REDEEM_AMOUNT);

  // Freeze the browser clock at the fork's timestamp before redeem becomes enabled.
  const { timestamp: chainNow } = await getBlock(publicClient);
  expect(chainNow).toBeLessThan(claimableAt);
  await page.clock.setFixedTime(Number(chainNow) * 1000);

  await page.goto("/swap");

  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  const redeemQueue = page.locator("#redeem-queue");
  await expect(
    redeemQueue.getByText(`${REDEEM_AMOUNT_DISPLAY} ${vusd.symbol}`),
  ).toBeVisible({ timeout: 20_000 });

  await expect(redeemQueue.getByText(/cooldown in progress/i)).toBeVisible();

  await redeemQueue.getByRole("button", { name: "Cancel redeem" }).click();

  const cancelModal = page.getByRole("dialog", { name: "Cancel redeem" });
  await expect(cancelModal).toBeVisible();
  await expect(
    cancelModal.getByRole("button", { name: "Keep redeem" }),
  ).toBeVisible();

  await cancelModal.getByRole("button", { name: "Cancel redeem" }).click();

  await expect(page.getByText("Redeem cancelled")).toBeVisible({
    timeout: 40_000,
  });
  await expect(cancelModal).toBeHidden();

  // The locked VUSD is back in the wallet, at exactly the pre-queue balance.
  await waitForBalance({ client: publicClient, token: vusd.address }).toBe(
    vusdBefore,
  );

  // The gateway cleared the request, so the queue falls back to its empty state.
  const [amountLockedAfter] = await getRedeemRequest(publicClient, {
    address: gatewayAddresses[0],
    user: TEST_ADDRESS,
  });
  expect(amountLockedAfter).toBe(0n);

  await expect(redeemQueue.getByText("Start with your assets")).toBeVisible();
});
