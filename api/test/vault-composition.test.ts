import { gatewayAddresses } from "@vetro-protocol/gateway";
import { getPeggedToken, getTreasury } from "@vetro-protocol/gateway/actions";
import {
  getPrice,
  getTokenConfig,
  getWhitelistedTokens,
  getWithdrawable,
} from "@vetro-protocol/treasury/actions";
import { type Address } from "viem";
import { decimals } from "viem-erc20/actions";
import { asset, totalAssets } from "viem-erc4626/actions";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  allocateComposition,
  getVaultComposition,
} from "../src/vault-composition.ts";
import {
  getStrategies,
  getStrategyConfig,
  getTotalDebt,
  getVaultName,
} from "../src/vesper.ts";

vi.mock("@vetro-protocol/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vetro-protocol/core")>()),
  createMainnetClient: vi.fn(() => ({})),
}));

vi.mock("@vetro-protocol/gateway/actions", () => ({
  getPeggedToken: vi.fn(),
  getTreasury: vi.fn(),
}));

vi.mock("@vetro-protocol/treasury/actions", () => ({
  getPrice: vi.fn(),
  getTokenConfig: vi.fn(),
  getWhitelistedTokens: vi.fn(),
  getWithdrawable: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  decimals: vi.fn(),
}));

vi.mock("viem-erc4626/actions", () => ({
  asset: vi.fn(),
  totalAssets: vi.fn(),
}));

vi.mock("../src/vesper.ts", () => ({
  getStrategies: vi.fn(),
  getStrategyConfig: vi.fn(),
  getTotalDebt: vi.fn(),
  getVaultName: vi.fn(),
}));

const stakingVaultAddress: Address =
  "0x0000000000000000000000000000000000000010";
const peggedTokenAddress: Address =
  "0x0000000000000000000000000000000000000001";
const treasuryAddress: Address = "0x0000000000000000000000000000000000000002";
const usdcAddress: Address = "0x0000000000000000000000000000000000000004";
const usdtAddress: Address = "0x0000000000000000000000000000000000000005";
const usdcYieldVault: Address = "0x0000000000000000000000000000000000000014";
const usdtYieldVault: Address = "0x0000000000000000000000000000000000000015";
const strategyA: Address = "0x0000000000000000000000000000000000000021";
const strategyB: Address = "0x0000000000000000000000000000000000000022";
const strategyInactive: Address = "0x0000000000000000000000000000000000000023";

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
  const unitPrice = 10n ** 8n;

  type Strategy = {
    active: boolean;
    address: Address;
    debt: bigint;
    name: string;
  };

  type TokenSetup = {
    latestPrice: bigint;
    strategies: Strategy[];
    tokenDecimals: number;
    totalDebt: bigint;
    withdrawable: bigint;
    yieldVault: Address;
  };

  const tokens: Record<Address, TokenSetup> = {};

  const findStrategy = (address: Address) =>
    Object.values(tokens)
      .flatMap(({ strategies }) => strategies)
      .find((strategy) => strategy.address === address)!;

  function setupToken(token: Address, setup: TokenSetup) {
    tokens[token] = setup;
  }

  beforeEach(function () {
    vi.resetAllMocks();
    Object.keys(tokens).forEach((key) => delete tokens[key as Address]);

    vi.mocked(asset).mockResolvedValue(peggedTokenAddress);
    vi.mocked(totalAssets).mockResolvedValue(10n ** 24n);
    vi.mocked(getPeggedToken).mockImplementation((_client, { address }) =>
      Promise.resolve(
        address === gatewayAddress
          ? peggedTokenAddress
          : "0x00000000000000000000000000000000000000ff",
      ),
    );
    vi.mocked(getTreasury).mockResolvedValue(treasuryAddress);
    vi.mocked(decimals).mockResolvedValue(18);
    vi.mocked(getWhitelistedTokens).mockImplementation(() =>
      Promise.resolve(Object.keys(tokens) as Address[]),
    );
    vi.mocked(getTokenConfig).mockImplementation((_client, { token }) =>
      Promise.resolve([
        tokens[token].yieldVault,
        "0x0000000000000000000000000000000000000099",
        3600n,
        true,
        true,
        tokens[token].tokenDecimals,
      ] as never),
    );
    vi.mocked(getWithdrawable).mockImplementation((_client, { token }) =>
      Promise.resolve(tokens[token].withdrawable),
    );
    vi.mocked(getPrice).mockImplementation((_client, { token }) =>
      Promise.resolve([tokens[token].latestPrice, unitPrice] as never),
    );
    vi.mocked(getTotalDebt).mockImplementation((_client, { address }) =>
      Promise.resolve(
        Object.values(tokens).find(({ yieldVault }) => yieldVault === address)!
          .totalDebt,
      ),
    );
    vi.mocked(getStrategies).mockImplementation((_client, { address }) =>
      Promise.resolve(
        Object.values(tokens)
          .find(({ yieldVault }) => yieldVault === address)!
          .strategies.map((strategy) => strategy.address),
      ),
    );
    vi.mocked(getStrategyConfig).mockImplementation((_client, { strategy }) =>
      Promise.resolve({
        active: findStrategy(strategy).active,
        debtRatio: 0n,
        totalDebt: findStrategy(strategy).debt,
        totalLoss: 0n,
        totalProfit: 0n,
      }),
    );
    vi.mocked(getVaultName).mockImplementation((_client, { address }) =>
      Promise.resolve(findStrategy(address).name),
    );
  });

  it("builds the composition with the strategies and the idle reserve of each token", async function () {
    setupToken(usdcAddress, {
      latestPrice: unitPrice,
      strategies: [
        {
          active: true,
          address: strategyA,
          debt: 600_000_000n,
          name: "Morpho_USDC_Core",
        },
        {
          active: false,
          address: strategyInactive,
          debt: 999_000_000n,
          name: "Inactive_Strategy",
        },
      ],
      tokenDecimals: 6,
      totalDebt: 600_000_000n,
      // 1000 USDC withdrawable, 600 of them lent out
      withdrawable: 1_000_000_000n,
      yieldVault: usdcYieldVault,
    });

    // 600 USDC in the strategy and 400 idle, over a vault with 10^24 assets
    expect(
      await getVaultComposition({ rpcUrl: undefined, stakingVaultAddress }),
    ).toEqual({
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
  });

  it("caps the oracle price at par and values below-par tokens at their price", async function () {
    // above par: valued at par, like Treasury.reserve()
    setupToken(usdcAddress, {
      latestPrice: unitPrice + 1_000_000n,
      strategies: [],
      tokenDecimals: 6,
      totalDebt: 0n,
      withdrawable: 500_000_000n,
      yieldVault: usdcYieldVault,
    });
    // 500 USDT at 0.5: worth 250
    setupToken(usdtAddress, {
      latestPrice: unitPrice / 2n,
      strategies: [],
      tokenDecimals: 6,
      totalDebt: 0n,
      withdrawable: 500_000_000n,
      yieldVault: usdtYieldVault,
    });

    const result = await getVaultComposition({
      rpcUrl: undefined,
      stakingVaultAddress,
    });

    // 500 and 250 over 750, applied to 10^24
    expect(result.items.map(({ amount, token }) => [token, amount])).toEqual([
      [usdcAddress, 666_666_666_666_666_666_666_667n],
      [usdtAddress, 333_333_333_333_333_333_333_333n],
    ]);
  });

  it("does not report a negative reserve when the debt exceeds the withdrawable amount", async function () {
    setupToken(usdcAddress, {
      latestPrice: unitPrice,
      strategies: [
        {
          active: true,
          address: strategyB,
          debt: 100_000_000n,
          name: "Strategy",
        },
      ],
      tokenDecimals: 6,
      totalDebt: 100_000_000n,
      withdrawable: 90_000_000n,
      yieldVault: usdcYieldVault,
    });

    const result = await getVaultComposition({
      rpcUrl: undefined,
      stakingVaultAddress,
    });

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

  it("fails when the oracle price is stale", async function () {
    setupToken(usdcAddress, {
      latestPrice: unitPrice,
      strategies: [],
      tokenDecimals: 6,
      totalDebt: 0n,
      withdrawable: 1n,
      yieldVault: usdcYieldVault,
    });
    vi.mocked(getPrice).mockRejectedValue(new Error("StalePrice"));

    await expect(
      getVaultComposition({ rpcUrl: undefined, stakingVaultAddress }),
    ).rejects.toThrow("StalePrice");
  });

  it("fails when no gateway matches the vault's asset", async function () {
    vi.mocked(asset).mockResolvedValue(
      "0x00000000000000000000000000000000000000aa",
    );

    await expect(
      getVaultComposition({ rpcUrl: undefined, stakingVaultAddress }),
    ).rejects.toThrow("No gateway found");
  });
});
