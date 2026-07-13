import {
  TEST_ADDRESS,
  TEST_PRIVATE_KEY,
} from "@hemilabs/anvil-fork-setup/utils";
import { expect } from "@playwright/test";
import {
  createWalletClient,
  erc20Abi,
  http,
  isAddressEqual,
  parseAbiItem,
  parseEventLogs,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  getBlock,
  getTransactionReceipt,
  readContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";
import { approve, balanceOf } from "viem-erc20/actions";

import { stakingVaultAbi } from "../../packages/earn/src/abi/stakingVaultAbi.ts";
import { sVusdAddress } from "../../packages/earn/src/stakingVaultAddresses.ts";
import { fastForwardTime } from "../scripts/fastForwardTime.ts";
import { setCooldownEnabled } from "../scripts/setCooldownEnabled.ts";
import { whitelistInstantWithdraw } from "../scripts/whitelistInstantWithdraw.ts";
import type { ExitTicket } from "../src/pages/earn/types.ts";

import { ANVIL_URL, createEthereumClient } from "./anvil";
import { test } from "./fixtures/wallet";
import { getMainnetToken, waitForBalance } from "./helpers";

const vusd = getMainnetToken("VUSD");
const DEPOSIT_DISPLAY = "5";
const DEPOSIT_AMOUNT = parseUnits(DEPOSIT_DISPLAY, vusd.decimals);

// The VUSD pool is the sVUSD ERC-4626 vault. A deposit emits the standard
// ERC-4626 Deposit(sender, owner, assets, shares); `shares` is exactly the
// sVUSD minted to the receiver, so we read it straight off the deposit tx.
const depositEvent = parseAbiItem(
  "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)",
);

test("deposit VUSD into the Earn pool", async function ({
  page,
  walletTxHashes,
}) {
  const publicClient = createEthereumClient();

  const [vusdBefore, svusdBefore] = await Promise.all([
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vusd.address,
    }),
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: sVusdAddress,
    }),
  ]);

  await page.goto("/");

  // The mock wallet auto-connects silently via EIP-6963 (see fixtures/wallet),
  // so just wait for the header button to switch from "Connect wallet" to the
  // 0x… short address — don't open the RainbowKit connect modal.
  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  // Navigate to Earn from the navbar. Routes are locale-prefixed (/en/earn), so
  // a bare page.goto("/earn") is parsed as lang="earn" and falls back to the
  // default page — clicking the nav link is both correct and what a user does.
  await page.getByRole("link", { name: "Earn" }).click();
  await expect(page).toHaveURL(/\/en\/earn/);

  // The Earn page renders one PoolInfoBar per vault (VUSD, vetBTC). Scope the
  // Deposit click to the bar that shows the "VUSD" token symbol so the test
  // doesn't depend on pool ordering. The only element containing both the VUSD
  // label and a Deposit button is the pool bar itself; `.last()` picks that
  // innermost match rather than an ancestor container.
  const vusdPool = page
    .locator("div")
    .filter({ has: page.getByText("VUSD", { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Deposit" }) })
    .last();
  await vusdPool.getByRole("button", { name: "Deposit" }).click();

  // The stake drawer slides in ("Manage your stake position").
  await expect(
    page.getByRole("heading", { name: "Manage your stake position" }),
  ).toBeVisible();

  await page
    .locator('input[type="text"]:not([disabled])')
    .first()
    .fill(DEPOSIT_DISPLAY);

  // Per-test snapshot/revert resets the allowance to 0, so the deposit takes the
  // two-tx path: the submit button reads "Approve and deposit". The mock wallet
  // signs both txs (approve, then deposit) with no popups.
  //
  // Dispatch the click straight to the button rather than a coordinate click:
  // the ApproveSection's info-icon tooltip (rc-tooltip, placement="top") in the
  // CollapsibleSection just below renders its overlay directly over this button,
  // and in CI it swallows the pointer events so a normal .click() never lands and
  // the test times out. dispatchEvent bypasses hit-testing and triggers the
  // form's submit handler directly; await the enabled state first so we don't
  // submit before balances load (the form's onSubmit no-ops while inputError set).
  const submitButton = page.getByRole("button", {
    name: /approve and deposit/i,
  });
  await expect(submitButton).toBeEnabled();
  await submitButton.dispatchEvent("click");

  // The success toast renders once both txs confirm on the fork (60s budget to
  // cover the two sequential signatures + confirmations).
  await expect(page.getByText("Stake deposit confirmed")).toBeVisible({
    timeout: 60_000,
  });

  // Check input resets to "0" on success
  await expect(
    page.locator('input[type="text"]:not([disabled])').first(),
  ).toHaveValue("0");

  // Assertion 1 — VUSD balance dropped by exactly the deposited amount.
  await waitForBalance({ client: publicClient, token: vusd.address }).toBe(
    vusdBefore - DEPOSIT_AMOUNT,
  );

  // Assertion 2 — read how many sVUSD were minted straight from the deposit tx.
  // The mock wallet sends approve then deposit, so walletTxHashes ends with the
  // deposit; its receipt carries the vault's ERC-4626 Deposit event, whose
  // `shares` is exactly the sVUSD minted to us — no block-range scan, no summing.
  const depositTxHash = walletTxHashes.at(-1);
  expect(depositTxHash).toBeDefined();
  const receipt = await getTransactionReceipt(publicClient, {
    hash: depositTxHash!,
  });
  const depositLogs = parseEventLogs({
    abi: [depositEvent],
    args: { owner: TEST_ADDRESS },
    eventName: "Deposit",
    logs: receipt.logs,
  });
  expect(depositLogs).toHaveLength(1);
  const svusdMinted = depositLogs[0].args.shares;
  expect(svusdMinted).toBeGreaterThan(0n);

  const svusdAfter = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: sVusdAddress,
  });
  expect(svusdAfter - svusdBefore).toBe(svusdMinted);

  // Assertion 3 — the staked position surfaces on the Earn page without any
  // backend API. The drawer auto-closes ~2s after success and clears its
  // stake-mode URL params (nuqs); wait for that so the reload lands on a clean
  // /en/earn — otherwise the persisted params reopen the drawer and its backdrop
  // overlay intercepts the badge hover below.
  await expect(
    page.getByRole("heading", { name: "Manage your stake position" }),
  ).toBeHidden({ timeout: 15_000 });

  // Reload so the staked-balance queries refetch the post-deposit state, then
  // assert the on-chain-derived "From 1 pool" badge appears and its tooltip
  // shows the staked VUSD amount (vault.convertToAssets(sVUSD)).
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  const fromPoolsBadge = page.getByText(/from 1 pool/i);
  await expect(fromPoolsBadge).toBeVisible({ timeout: 20_000 });

  await fromPoolsBadge.hover();
  // The tooltip lists the pool's staked balance as "(<amount> VUSD)".
  await expect(page.getByText(/\([\d.,]+\s*VUSD\)/)).toBeVisible({
    timeout: 10_000,
  });
});

const WITHDRAW_DISPLAY = "3";
const WITHDRAW_AMOUNT = parseUnits(WITHDRAW_DISPLAY, vusd.decimals);

// The instant (one-step) withdraw is a plain ERC-4626 withdraw, which emits the
// standard Withdraw(sender, receiver, owner, assets, shares). `assets` is the
// VUSD paid out to the receiver and `shares` the sVUSD burned — both read
// straight off the withdraw tx, no block-range scan.
const withdrawEvent = parseAbiItem(
  "event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)",
);

// Give the test account a real staked position by actually depositing VUSD into
// the vault (approve + deposit) as the test account, signing directly against
// Anvil rather than through the browser mock wallet. A real deposit leaves the
// vault holding the underlying VUSD, so the later withdraw can pay out — minting
// sVUSD via storage would leave the vault unbacked and the withdraw would revert.
async function stakeVusd(assets: bigint) {
  const walletClient = createWalletClient({
    account: privateKeyToAccount(TEST_PRIVATE_KEY),
    chain: mainnet,
    transport: http(ANVIL_URL),
  });

  const approvalHash = await approve(walletClient, {
    address: vusd.address,
    amount: assets,
    spender: sVusdAddress,
  });
  await waitForTransactionReceipt(walletClient, { hash: approvalHash });

  const depositHash = await writeContract(walletClient, {
    abi: stakingVaultAbi,
    address: sVusdAddress,
    args: [assets, TEST_ADDRESS],
    functionName: "deposit",
  });
  await waitForTransactionReceipt(walletClient, { hash: depositHash });
}

test("withdraw VUSD from the Earn pool (whitelisted one-step exit)", async function ({
  page,
  walletTxHashes,
}) {
  const publicClient = createEthereumClient();

  await stakeVusd(DEPOSIT_AMOUNT);
  await whitelistInstantWithdraw({ address: TEST_ADDRESS, forkUrl: ANVIL_URL });

  const [vusdBefore, svusdBefore] = await Promise.all([
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vusd.address,
    }),
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: sVusdAddress,
    }),
  ]);

  await page.goto("/");

  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  await page.getByRole("link", { name: "Earn" }).click();
  await expect(page).toHaveURL(/\/en\/earn/);

  // Scope to the VUSD pool bar and open its Withdraw drawer. The bar is the only
  // element holding both the "VUSD" label and a Withdraw button; `.last()` picks
  // that innermost match rather than an ancestor container.
  const vusdPool = page
    .locator("div")
    .filter({ has: page.getByText("VUSD", { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Withdraw" }) })
    .last();
  await vusdPool.getByRole("button", { name: "Withdraw" }).click();

  // The drawer slides in directly in withdraw mode.
  await expect(
    page.getByRole("heading", { name: "Manage your stake position" }),
  ).toBeVisible();

  await expect(page.getByText("Confirm withdrawal")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Request withdrawal" }),
  ).toBeHidden();

  await page
    .locator('input[type="text"]:not([disabled])')
    .first()
    .fill(WITHDRAW_DISPLAY);

  const submitButton = page
    .locator("form")
    .getByRole("button", { exact: true, name: "Withdraw" });
  await expect(submitButton).toBeEnabled();
  await submitButton.dispatchEvent("click");

  await expect(page.getByText("Withdrawal complete")).toBeVisible({
    timeout: 40_000,
  });

  // Check input resets to "0" on success
  await expect(
    page.locator('input[type="text"]:not([disabled])').first(),
  ).toHaveValue("0");

  const withdrawTxHash = walletTxHashes.at(-1);
  expect(withdrawTxHash).toBeDefined();
  const receipt = await getTransactionReceipt(publicClient, {
    hash: withdrawTxHash!,
  });
  const withdrawLogs = parseEventLogs({
    abi: [withdrawEvent],
    args: { owner: TEST_ADDRESS },
    eventName: "Withdraw",
    logs: receipt.logs,
  });
  expect(withdrawLogs).toHaveLength(1);
  const { assets: vusdWithdrawn, shares: svusdBurned } = withdrawLogs[0].args;
  expect(vusdWithdrawn).toBe(WITHDRAW_AMOUNT);
  expect(svusdBurned).toBeGreaterThan(0n);

  // Assertion — VUSD balance rose by exactly the withdrawn assets and sVUSD
  // dropped by exactly the burned shares.
  await waitForBalance({ client: publicClient, token: vusd.address }).toBe(
    vusdBefore + vusdWithdrawn,
  );

  const svusdAfter = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: sVusdAddress,
  });
  expect(svusdBefore - svusdBurned).toBe(svusdAfter);
});

test("withdraw VUSD from the Earn pool (two-step cooldown exit)", async function ({
  page,
  walletTxHashes,
}) {
  const publicClient = createEthereumClient();

  // Seed a real staked position, then enable cooldown WITHOUT whitelisting so
  // the app takes the two-step path: when cooldown is disabled the app treats
  // everyone as instant (fetchCanInstantWithdraw), and whitelisting would force
  // the instant one-step form. Leaving the account un-whitelisted keeps the
  // "Request withdrawal" flow and renders the exit-tickets section.
  await stakeVusd(DEPOSIT_AMOUNT);
  await setCooldownEnabled({ forkUrl: ANVIL_URL });

  expect(
    await readContract(publicClient, {
      abi: stakingVaultAbi,
      address: sVusdAddress,
      functionName: "cooldownEnabled",
    }),
  ).toBe(true);

  const [vusdBefore, svusdBefore] = await Promise.all([
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vusd.address,
    }),
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: sVusdAddress,
    }),
  ]);

  // Drive the exit-tickets table from a mocked API response we control (the
  // endpoint is otherwise stubbed with [] by the wallet fixture).
  let exitTicketsBody: ExitTicket[] = [];
  await page.route("**/variable-stake/exit-tickets/**", (route) =>
    route.fulfill({ json: exitTicketsBody }),
  );

  await page.goto("/");

  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  await page.getByRole("link", { name: "Earn" }).click();
  await expect(page).toHaveURL(/\/en\/earn/);

  // Open the VUSD pool's Withdraw drawer (same locator as the one-step test).
  const vusdPool = page
    .locator("div")
    .filter({ has: page.getByText("VUSD", { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "Withdraw" }) })
    .last();
  await vusdPool.getByRole("button", { name: "Withdraw" }).click();

  await expect(
    page.getByRole("heading", { name: "Manage your stake position" }),
  ).toBeVisible();

  // Fill the amount first: with an empty input the submit button reads "Enter an
  // amount", and only resolves to its action label once a valid amount is set.
  await page
    .locator('input[type="text"]:not([disabled])')
    .first()
    .fill(WITHDRAW_DISPLAY);

  // Two-step path: with an amount entered the submit reads "Request withdrawal"
  // (the instant path would read "Withdraw" instead) — this proves the account
  // is on the request → cooldown → claim flow. Generous timeout: the drawer's
  // form body is gated on the canInstantWithdraw/staked-balance reads, and this
  // is the first hit to the Earn route when the test runs in isolation (Vite
  // compiles it on demand).
  const submitButton = page
    .locator("form")
    .getByRole("button", { name: "Request withdrawal" });
  await expect(submitButton).toBeEnabled({ timeout: 20_000 });
  // Dispatch the click to bypass the fee-section tooltip overlay in CI (see the
  // deposit test for the full rationale).
  await submitButton.dispatchEvent("click");

  await expect(page.getByText("Withdrawal request confirmed")).toBeVisible({
    timeout: 60_000,
  });

  // The drawer auto-closes ~2s after success and clears its stake-mode URL
  // params (nuqs). Wait for that before reloading below — otherwise the
  // persisted params reopen the drawer and its overlay intercepts clicks on the
  // exit-tickets table (see the deposit test for the same rationale).
  await expect(
    page.getByRole("heading", { name: "Manage your stake position" }),
  ).toBeHidden({ timeout: 15_000 });

  // Read the request tx: WithdrawRequested carries the requestId, the locked
  // shares/assets, and the on-chain claimableAt. This is the same event
  // useStakeWithdraw parses to build its optimistic ticket.
  const requestTxHash = walletTxHashes.at(-1);
  expect(requestTxHash).toBeDefined();
  const requestReceipt = await getTransactionReceipt(publicClient, {
    hash: requestTxHash!,
  });
  const requestLogs = parseEventLogs({
    abi: stakingVaultAbi,
    args: { owner: TEST_ADDRESS },
    eventName: "WithdrawRequested",
    logs: requestReceipt.logs,
  });
  expect(requestLogs).toHaveLength(1);
  const { assets, claimableAt, requestId, shares } = requestLogs[0].args;
  expect(claimableAt).toBeGreaterThan(0n);
  expect(assets).toBe(WITHDRAW_AMOUNT);
  expect(shares).toBeGreaterThan(0n);

  // Shares leave the wallet at request time; VUSD is only paid out on claim.
  const svusdAfterRequest = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: sVusdAddress,
  });
  expect(svusdAfterRequest).toBe(svusdBefore - shares);
  expect(
    await balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vusd.address,
    }),
  ).toBe(vusdBefore);

  const ticket: ExitTicket = {
    assets: assets.toString(),
    claimableAt: claimableAt.toString(),
    owner: TEST_ADDRESS,
    requestId: requestId.toString(),
    requestTxHash: requestTxHash!,
    shares: shares.toString(),
    stakingVaultAddress: sVusdAddress,
  };

  // Cooldown state — mock returns the ticket with its real (future) claimableAt.
  exitTicketsBody = [ticket];
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  const exitTickets = page.locator("#exit-tickets");
  await expect(exitTickets.getByText("Cooldown in progress")).toBeVisible({
    timeout: 20_000,
  });

  // Fast-forward the fork past claimableAt so the claim tx passes the contract's
  // block.timestamp check (Gateway/vault _handleRedeemOrWithdraw).
  const { timestamp: chainNow } = await getBlock(publicClient);
  await fastForwardTime({
    forkUrl: ANVIL_URL,
    seconds: Number(claimableAt - chainNow),
  });

  // Ready state — override claimableAt to a past unix ts so getTicketStatus
  // resolves to "ready" against the real browser clock.
  exitTicketsBody = [{ ...ticket, claimableAt: "1" }];
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  await expect(exitTickets.getByText("Ready to withdraw")).toBeVisible({
    timeout: 20_000,
  });

  // Step 2 — claim from the row. `exact` avoids matching the "Withdraw all"
  // button.
  const rowWithdrawButton = exitTickets.getByRole("button", {
    exact: true,
    name: "Withdraw",
  });
  await expect(rowWithdrawButton).toBeEnabled();
  await rowWithdrawButton.click();

  await expect(page.getByText("Withdrawal complete")).toBeVisible({
    timeout: 40_000,
  });

  // Confirm the payout against the claim tx itself: sum the VUSD transferred to
  // the receiver in the claim receipt. walletTxHashes ends with the claim tx
  // (seeding used a separate client; the only browser txs are the request then
  // the claim). The StakingVault ABI has no claim event, so read the standard
  // ERC-20 Transfer(to = receiver) logs on the VUSD token.
  const claimTxHash = walletTxHashes.at(-1);
  expect(claimTxHash).toBeDefined();
  const claimReceipt = await getTransactionReceipt(publicClient, {
    hash: claimTxHash!,
  });
  const vusdReceived = parseEventLogs({
    abi: erc20Abi,
    args: { to: TEST_ADDRESS },
    eventName: "Transfer",
    logs: claimReceipt.logs,
  })
    .filter((log) => isAddressEqual(log.address, vusd.address))
    .reduce((sum, log) => sum + log.args.value, 0n);
  expect(vusdReceived).toBeGreaterThan(0n);

  // useClaimWithdraw optimistically sets claimTxHash on the cached ticket, so the
  // row flips to "Withdrawn". Mirror that onto the mocked endpoint too, so a
  // background refetch can't overwrite the optimistic state and revert the row
  // back to "ready".
  exitTicketsBody = [
    { ...ticket, claimableAt: "1", claimTxHash: claimTxHash! },
  ];
  await expect(exitTickets.getByText("Withdrawn")).toBeVisible();

  // VUSD rose by exactly what the claim receipt paid out; sVUSD stays at its
  // post-request value (the shares were already removed at request time).
  await waitForBalance({ client: publicClient, token: vusd.address }).toBe(
    vusdBefore + vusdReceived,
  );
  expect(
    await balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: sVusdAddress,
    }),
  ).toBe(svusdAfterRequest);

  // Check the toast
  await expect(page.getByText("Withdrawal complete")).toBeVisible({
    timeout: 10_000,
  });
});
