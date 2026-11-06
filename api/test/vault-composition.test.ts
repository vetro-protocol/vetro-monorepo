import { gatewayAddresses } from "@vetro-protocol/gateway";
import { getPeggedToken } from "@vetro-protocol/gateway/actions";
import { type Address } from "viem";
import { decimals } from "viem-erc20/actions";
import { asset, totalAssets } from "viem-erc4626/actions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  allocateComposition,
  getVaultComposition,
} from "../src/vault-composition.ts";
import { readWarmedTask } from "../src/warm-cache.ts";
import { treasuryTask } from "../src/warm-tasks.ts";

vi.mock("@vetro-protocol/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vetro-protocol/core")>()),
  createMainnetClient: vi.fn(() => ({})),
}));

vi.mock("@vetro-protocol/gateway/actions", () => ({
  getPeggedToken: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  decimals: vi.fn(),
}));

vi.mock("viem-erc4626/actions", () => ({
  asset: vi.fn(),
  totalAssets: vi.fn(),
}));

vi.mock("../src/warm-cache.ts", () => ({
  readWarmedTask: vi.fn(),
}));

vi.mock("../src/warm-tasks.ts", () => ({
  treasuryTask: {},
}));

const stakingVaultAddress: Address =
  "0x0000000000000000000000000000000000000010";
const peggedTokenAddress: Address =
  "0x0000000000000000000000000000000000000001";
const usdcAddress: Address = "0x0000000000000000000000000000000000000004";
const usdtAddress: Address = "0x0000000000000000000000000000000000000005";

describe("allocateComposition", function () {
  it("distributes the total pro rata by value", function () {
    const result = allocateComposition({
      items: [
        { name: "A", token: usdcAddress, type: "strategy", value: 300n },
        { token: usdcAddress, type: "reserve", value: 100n },
      ],
      total: 2_000n,
    });

    expect(result).toEqual({
      items: [
        {
          amount: 1_500n,
          name: "A",
          share: 0.75,
          token: usdcAddress,
          type: "strategy",
        },
        {
          amount: 500n,
          name: undefined,
          share: 0.25,
          token: usdcAddress,
          type: "reserve",
        },
      ],
      total: 2_000n,
    });
  });

  it("gives the rounding remainder to the largest item so the amounts add up to the total", function () {
    const result = allocateComposition({
      items: [
        { token: usdcAddress, type: "reserve", value: 1n },
        { name: "A", token: usdcAddress, type: "strategy", value: 1n },
        { name: "B", token: usdtAddress, type: "strategy", value: 1n },
      ],
      total: 100n,
    });

    // 100 / 3 floors to 33 each; the remaining 1 goes to the first largest
    expect(result.items.map(({ amount }) => amount)).toEqual([34n, 33n, 33n]);
    expect(result.items[0].type).toBe("reserve");
    expect(result.items.reduce((acc, { amount }) => acc + amount, 0n)).toBe(
      100n,
    );
  });

  it("gives the remainder to the item with the largest value, not the first one", function () {
    const result = allocateComposition({
      items: [
        { token: usdcAddress, type: "reserve", value: 1n },
        { name: "A", token: usdtAddress, type: "strategy", value: 2n },
      ],
      total: 10n,
    });

    // floors to 3 and 6; the remaining 1 goes to the largest (value 2)
    expect(result.items.map(({ amount }) => amount)).toEqual([7n, 3n]);
    expect(result.items[0].name).toBe("A");
  });

  it("omits the items with a zero amount and sorts the rest by amount, descending", function () {
    const result = allocateComposition({
      items: [
        { token: usdcAddress, type: "reserve", value: 10n },
        { name: "Dust", token: usdcAddress, type: "strategy", value: 1n },
        { name: "Big", token: usdtAddress, type: "strategy", value: 989n },
        { token: usdtAddress, type: "reserve", value: 0n },
      ],
      total: 100n,
    });

    // Dust floors to 0 (1 * 100 / 1000); the reserve of 0 value is zero too
    expect(result.items.map(({ amount, name }) => [name, amount])).toEqual([
      ["Big", 99n],
      [undefined, 1n],
    ]);
  });

  it("returns no items when there is nothing to value", function () {
    expect(
      allocateComposition({
        items: [{ token: usdcAddress, type: "reserve", value: 0n }],
        total: 100n,
      }),
    ).toEqual({ items: [], total: 100n });
  });

  it("returns no items for an empty vault", function () {
    expect(
      allocateComposition({
        items: [{ token: usdcAddress, type: "reserve", value: 5n }],
        total: 0n,
      }),
    ).toEqual({ items: [], total: 0n });
  });
});

describe("getVaultComposition", function () {
  const gatewayAddress = gatewayAddresses[0];
  const now = 1_700_000_000;
  const unitPrice = 10n ** 8n;
  const stalePeriod = 3_600;
  const c = { env: {} } as never;

  type WarmedTokenOptions = {
    activeStrategies?: { name: string; totalDebt: bigint }[];
    latestPrice?: bigint;
    stalePeriod?: number;
    tokenAddress: Address;
    totalDebt?: bigint;
    updatedAt?: number;
    withdrawable: bigint;
  };

  // The shape the warmed treasury task yields: bigints as strings
  const warmedToken = ({
    activeStrategies = [],
    latestPrice = unitPrice,
    stalePeriod: tokenStalePeriod = stalePeriod,
    tokenAddress,
    totalDebt = 0n,
    updatedAt = now,
    withdrawable,
  }: WarmedTokenOptions) => ({
    activeStrategies: activeStrategies.map((strategy) => ({
      address: "0x0000000000000000000000000000000000000021",
      name: strategy.name,
      totalDebt: strategy.totalDebt.toString(),
    })),
    latestPrice: latestPrice.toString(),
    priceDecimals: 8,
    stalePeriod: tokenStalePeriod.toString(),
    tokenAddress,
    tokenDecimals: 6,
    totalDebt: totalDebt.toString(),
    updatedAt: updatedAt.toString(),
    withdrawable: withdrawable.toString(),
  });

  const mockWarmedTokens = (...tokens: WarmedTokenOptions[]) =>
    vi
      .mocked(readWarmedTask)
      .mockResolvedValue(tokens.map(warmedToken) as never);

  beforeEach(function () {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);

    vi.mocked(asset).mockResolvedValue(peggedTokenAddress);
    vi.mocked(totalAssets).mockResolvedValue(10n ** 24n);
    vi.mocked(getPeggedToken).mockImplementation((_client, { address }) =>
      Promise.resolve(
        address === gatewayAddress
          ? peggedTokenAddress
          : "0x00000000000000000000000000000000000000ff",
      ),
    );
    vi.mocked(decimals).mockResolvedValue(18);
  });

  afterEach(function () {
    vi.useRealTimers();
  });

  it("builds the composition from the warmed treasury of the vault's gateway", async function () {
    mockWarmedTokens({
      activeStrategies: [{ name: "Morpho USDC Core", totalDebt: 600_000_000n }],
      tokenAddress: usdcAddress,
      totalDebt: 600_000_000n,
      // 1000 USDC withdrawable, 600 of them lent out
      withdrawable: 1_000_000_000n,
    });

    // 600 USDC in the strategy and 400 idle, over a vault with 10^24 assets
    expect(await getVaultComposition({ c, stakingVaultAddress })).toEqual({
      items: [
        {
          amount: 6n * 10n ** 23n,
          name: "Morpho USDC Core",
          share: 0.6,
          token: usdcAddress,
          type: "strategy",
        },
        {
          amount: 4n * 10n ** 23n,
          name: undefined,
          share: 0.4,
          token: usdcAddress,
          type: "reserve",
        },
      ],
      total: 10n ** 24n,
    });
    expect(vi.mocked(readWarmedTask)).toHaveBeenCalledWith({
      c,
      item: gatewayAddress,
      task: treasuryTask,
    });
  });

  it("caps the oracle price at par and values below-par tokens at their price", async function () {
    mockWarmedTokens(
      // above par: valued at par, like Treasury.reserve()
      {
        latestPrice: unitPrice + 1_000_000n,
        tokenAddress: usdcAddress,
        withdrawable: 500_000_000n,
      },
      // 500 USDT at 0.5: worth 250
      {
        latestPrice: unitPrice / 2n,
        tokenAddress: usdtAddress,
        withdrawable: 500_000_000n,
      },
    );

    const result = await getVaultComposition({ c, stakingVaultAddress });

    // 500 and 250 over 750, applied to 10^24
    expect(result.items.map(({ amount, token }) => [token, amount])).toEqual([
      [usdcAddress, 666_666_666_666_666_666_666_667n],
      [usdtAddress, 333_333_333_333_333_333_333_333n],
    ]);
  });

  it("does not report a negative reserve when the debt exceeds the withdrawable amount", async function () {
    mockWarmedTokens({
      activeStrategies: [{ name: "Strategy", totalDebt: 100_000_000n }],
      tokenAddress: usdcAddress,
      totalDebt: 100_000_000n,
      withdrawable: 90_000_000n,
    });

    const result = await getVaultComposition({ c, stakingVaultAddress });

    expect(result.items).toEqual([
      {
        amount: 10n ** 24n,
        name: "Strategy",
        share: 1,
        token: usdcAddress,
        type: "strategy",
      },
    ]);
  });

  it("values a token far off par at its price instead of failing", async function () {
    // 0.8 is well beyond any price tolerance, which Treasury.getPrice rejects
    // but Treasury.reserve() accepts
    mockWarmedTokens(
      {
        latestPrice: (unitPrice * 8n) / 10n,
        tokenAddress: usdcAddress,
        withdrawable: 500_000_000n,
      },
      { tokenAddress: usdtAddress, withdrawable: 100_000_000n },
    );

    const result = await getVaultComposition({ c, stakingVaultAddress });

    // 400 and 100 over 500, applied to 10^24
    expect(result.items.map(({ amount, token }) => [token, amount])).toEqual([
      [usdcAddress, 8n * 10n ** 23n],
      [usdtAddress, 2n * 10n ** 23n],
    ]);
  });

  it("accepts a price updated exactly stalePeriod seconds ago", async function () {
    mockWarmedTokens({
      tokenAddress: usdcAddress,
      updatedAt: now - stalePeriod,
      withdrawable: 1_000_000n,
    });

    await expect(
      getVaultComposition({ c, stakingVaultAddress }),
    ).resolves.toBeDefined();
  });

  it("fails when a price was updated more than stalePeriod seconds ago", async function () {
    // Fresh when the cron warmed it, but stale by the time of the request
    mockWarmedTokens(
      { tokenAddress: usdcAddress, withdrawable: 1_000_000n },
      {
        tokenAddress: usdtAddress,
        updatedAt: now - stalePeriod - 1,
        withdrawable: 1_000_000n,
      },
    );

    await expect(
      getVaultComposition({ c, stakingVaultAddress }),
    ).rejects.toThrow(`Stale oracle price for ${usdtAddress}`);
  });

  it("fails when a price is not positive", async function () {
    mockWarmedTokens({
      latestPrice: 0n,
      tokenAddress: usdcAddress,
      withdrawable: 1_000_000n,
    });

    await expect(
      getVaultComposition({ c, stakingVaultAddress }),
    ).rejects.toThrow(`Invalid oracle price for ${usdcAddress}`);
  });

  it("fails when no gateway matches the vault's asset", async function () {
    vi.mocked(asset).mockResolvedValue(
      "0x00000000000000000000000000000000000000aa",
    );

    await expect(
      getVaultComposition({ c, stakingVaultAddress }),
    ).rejects.toThrow("No gateway found");
    expect(vi.mocked(readWarmedTask)).not.toHaveBeenCalled();
  });
});
