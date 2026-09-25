import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import type { MarketId } from "@morpho-org/blue-sdk";
import { fetchPosition } from "@morpho-org/blue-sdk-viem";
import { expect } from "@playwright/test";
import { formatUnits, parseUnits } from "viem";
import { getBlock } from "viem/actions";
import { balanceOf } from "viem-erc20/actions";

import { openBorrowPosition } from "../scripts/openBorrowPosition.ts";
import { marketIds } from "../src/constants/borrow.ts";
import { formatNumber } from "../src/utils/format.ts";

import { ANVIL_URL, createEthereumClient } from "./anvil";
import { test } from "./fixtures/wallet";
import { getMainnetToken, waitForBalance } from "./helpers";

const hemiBtc = getMainnetToken("hemiBTC");
const vusd = getMainnetToken("VUSD");
const hemiBtcVusdMarketId = marketIds[0] as MarketId;
const COLLATERAL_DISPLAY = "0.05";
const COLLATERAL_AMOUNT = parseUnits(COLLATERAL_DISPLAY, hemiBtc.decimals);
const BORROW_DISPLAY = "1000";
const BORROW_AMOUNT = parseUnits(BORROW_DISPLAY, vusd.decimals);
const BORROW_MORE_DISPLAY = "500";
const BORROW_MORE_AMOUNT = parseUnits(BORROW_MORE_DISPLAY, vusd.decimals);

// The loan cell adds the interest accrued since the borrow, so the decimals
// are not fixed.
const loanCellText = (display: string) =>
  new RegExp(`^${formatNumber(display)}(\\.\\d+)? ${vusd.symbol}$`);

test("start a borrow position on the hemiBTC / VUSD market", async function ({
  page,
}) {
  const publicClient = createEthereumClient();

  const [hemiBtcBefore, vusdBefore] = await Promise.all([
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: hemiBtc.address,
    }),
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vusd.address,
    }),
  ]);

  await page.goto(`/borrow/${hemiBtcVusdMarketId}`);

  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  const amountInputs = page.locator('input[type="text"]:not([disabled])');
  await amountInputs.nth(0).fill(COLLATERAL_DISPLAY);
  await amountInputs.nth(1).fill(BORROW_DISPLAY);

  const submitButton = page.getByRole("button", {
    name: "Supply collateral and borrow",
  });
  await expect(submitButton).toBeEnabled({ timeout: 20_000 });
  await submitButton.click();

  await expect(page.getByText("Borrow successful")).toBeVisible({
    timeout: 60_000,
  });

  await expect(page.getByText("You have a position already open")).toBeVisible({
    timeout: 20_000,
  });

  await waitForBalance({ client: publicClient, token: vusd.address }).toBe(
    vusdBefore + BORROW_AMOUNT,
  );

  const hemiBtcAfter = await balanceOf(publicClient, {
    account: TEST_ADDRESS,
    address: hemiBtc.address,
  });
  expect(hemiBtcAfter).toBe(hemiBtcBefore - COLLATERAL_AMOUNT);

  const position = await fetchPosition(
    TEST_ADDRESS,
    hemiBtcVusdMarketId,
    publicClient,
  );
  expect(position.collateral).toBe(COLLATERAL_AMOUNT);
  expect(position.borrowShares).toBeGreaterThan(0n);

  await page.getByRole("link", { name: "View positions" }).click();

  const positions = page.locator("#borrow-positions");
  await expect(
    positions.getByText(
      `${formatNumber(COLLATERAL_DISPLAY)} ${hemiBtc.symbol}`,
    ),
  ).toBeVisible({ timeout: 30_000 });

  await expect(positions.getByText(loanCellText(BORROW_DISPLAY))).toBeVisible();

  await expect(
    positions.locator(`#manage-${hemiBtcVusdMarketId}`),
  ).toBeVisible();
});

test("borrow more on an open hemiBTC / VUSD position", async function ({
  page,
}) {
  const publicClient = createEthereumClient();

  await openBorrowPosition({
    address: TEST_ADDRESS,
    borrowAmount: BORROW_DISPLAY,
    collateralAmount: COLLATERAL_DISPLAY,
    forkUrl: ANVIL_URL,
    marketId: hemiBtcVusdMarketId,
  });

  const [vusdBefore, positionBefore] = await Promise.all([
    balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vusd.address,
    }),
    fetchPosition(TEST_ADDRESS, hemiBtcVusdMarketId, publicClient),
  ]);

  const { timestamp: chainNow } = await getBlock(publicClient);
  await page.clock.install({ time: Number(chainNow) * 1000 });

  await page.goto("/borrow");

  await expect(
    page.getByRole("button", { name: /^0x[a-f0-9]{4}/i }),
  ).toBeVisible({ timeout: 30_000 });

  const positions = page.locator("#borrow-positions");
  const positionCells = positions
    .locator("tr")
    .filter({ has: page.locator(`#manage-${hemiBtcVusdMarketId}`) })
    .locator("td");
  const healthFactorCell = positionCells.nth(2);
  const ltvCell = positionCells.nth(4).locator("span").first();

  await expect(positions.getByText(loanCellText(BORROW_DISPLAY))).toBeVisible({
    timeout: 30_000,
  });
  await expect(healthFactorCell).toHaveText(/^\d+\.\d{2}$/);
  await expect(ltvCell).toHaveText(/%$/);
  const healthFactorBefore = parseFloat(await healthFactorCell.innerText());
  const ltvBefore = parseFloat(await ltvCell.innerText());

  await page.locator(`#manage-${hemiBtcVusdMarketId}`).click();
  await page.getByRole("menuitem", { name: "Borrow more" }).click();

  const drawer = page
    .getByRole("heading", { name: "Borrow more" })
    .locator("..");
  await drawer
    .locator('input[type="text"]:not([disabled])')
    .fill(BORROW_MORE_DISPLAY);

  const submitButton = drawer.getByRole("button", {
    exact: true,
    name: "Borrow",
  });
  await expect(submitButton).toBeEnabled({ timeout: 20_000 });
  await submitButton.click();

  await expect(page.getByText("Borrow successful")).toBeVisible({
    timeout: 60_000,
  });

  await waitForBalance({ client: publicClient, token: vusd.address }).toBe(
    vusdBefore + BORROW_MORE_AMOUNT,
  );

  const positionAfter = await fetchPosition(
    TEST_ADDRESS,
    hemiBtcVusdMarketId,
    publicClient,
  );
  expect(positionAfter.collateral).toBe(COLLATERAL_AMOUNT);
  expect(positionAfter.borrowShares).toBeGreaterThan(
    positionBefore.borrowShares,
  );

  const totalBorrowDisplay = formatUnits(
    BORROW_AMOUNT + BORROW_MORE_AMOUNT,
    vusd.decimals,
  );
  await expect(
    positions.getByText(loanCellText(totalBorrowDisplay)),
  ).toBeVisible({ timeout: 30_000 });

  expect(parseFloat(await healthFactorCell.innerText())).toBeLessThan(
    healthFactorBefore,
  );
  expect(parseFloat(await ltvCell.innerText())).toBeGreaterThan(ltvBefore);
});
