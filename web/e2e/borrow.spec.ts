import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import type { MarketId } from "@morpho-org/blue-sdk";
import { fetchPosition } from "@morpho-org/blue-sdk-viem";
import { expect } from "@playwright/test";
import { parseUnits } from "viem";
import { balanceOf } from "viem-erc20/actions";

import { marketIds } from "../src/constants/borrow.ts";
import { formatNumber } from "../src/utils/format.ts";

import { createEthereumClient } from "./anvil";
import { test } from "./fixtures/wallet";
import { getMainnetToken, waitForBalance } from "./helpers";

const hemiBtc = getMainnetToken("hemiBTC");
const vusd = getMainnetToken("VUSD");
const hemiBtcVusdMarketId = marketIds[0];
const COLLATERAL_DISPLAY = "0.05";
const COLLATERAL_AMOUNT = parseUnits(COLLATERAL_DISPLAY, hemiBtc.decimals);
const BORROW_DISPLAY = "1000";
const BORROW_AMOUNT = parseUnits(BORROW_DISPLAY, vusd.decimals);

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
    hemiBtcVusdMarketId as MarketId,
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

  // The loan cell adds the interest accrued since the borrow, so the decimals
  // are not fixed.
  await expect(
    positions.getByText(
      new RegExp(`^${formatNumber(BORROW_DISPLAY)}(\\.\\d+)? ${vusd.symbol}$`),
    ),
  ).toBeVisible();

  await expect(
    positions.locator(`#manage-${hemiBtcVusdMarketId}`),
  ).toBeVisible();
});
