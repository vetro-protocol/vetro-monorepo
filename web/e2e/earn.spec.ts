import {
  TEST_ADDRESS,
  TEST_PRIVATE_KEY,
} from "@hemilabs/anvil-fork-setup/utils";
import { expect } from "@playwright/test";
import {
  createWalletClient,
  http,
  parseAbiItem,
  parseEventLogs,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  getTransactionReceipt,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { mainnet } from "viem/chains";
import { approve, balanceOf } from "viem-erc20/actions";

import { stakingVaultAbi } from "../../packages/earn/src/abi/stakingVaultAbi.ts";
import { sVusdAddress } from "../../packages/earn/src/stakingVaultAddresses.ts";
import { whitelistInstantWithdraw } from "../scripts/whitelistInstantWithdraw.ts";

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
