import type { Address } from "viem";
import { describe, expect, it } from "vitest";

import {
  addDepositToNetRevenue,
  addDepositToYield,
} from "../../src/utils/analyticsDeposit";

const usdc: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const usdt: Address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const strategy: Address = "0x0000000000000000000000000000000000000001";

const yieldData = {
  items: [
    {
      address: strategy,
      apy: 5,
      balance: 800n,
      name: "Strategy",
      projectedYield: 40n,
      token: usdc,
      type: "strategy" as const,
    },
    {
      apy: 0,
      balance: 100n,
      projectedYield: 0n,
      token: usdc,
      type: "reserve" as const,
    },
    {
      apy: 0,
      balance: 100n,
      projectedYield: 0n,
      token: usdt,
      type: "reserve" as const,
    },
  ],
  total: { apy: 4, balance: 1000n, projectedYield: 40n },
};

const netRevenueData = {
  backendApy: 4,
  backendBalance: 1000n,
  backendYield: 40n,
  netRevenue: 10n,
  staked: 300n,
  stakerApr: 10,
  stakerPayouts: 30n,
  stakingVaultAddress: strategy,
};

describe("addDepositToYield", function () {
  it("adds the amount to the reserve of the deposited token and to the total", function () {
    const { items, total } = addDepositToYield({
      amount: 600n,
      data: yieldData,
      token: usdt,
    });

    expect(items.map((item) => item.balance)).toEqual([800n, 100n, 700n]);
    expect(total).toEqual({ apy: 2.5, balance: 1600n, projectedYield: 40n });
  });

  it("keeps a null APY when the projected yield is unknown", function () {
    const { total } = addDepositToYield({
      amount: 600n,
      data: {
        ...yieldData,
        total: { apy: null, balance: 1000n, projectedYield: null },
      },
      token: usdt,
    });

    expect(total).toEqual({ apy: null, balance: 1600n, projectedYield: null });
  });
});

describe("addDepositToNetRevenue", function () {
  it("adds the amount to the backend balance and dilutes the backend APY", function () {
    expect(
      addDepositToNetRevenue({ amount: 600n, data: netRevenueData }),
    ).toEqual({ ...netRevenueData, backendApy: 2.5, backendBalance: 1600n });
  });
});
