import type { Address } from "viem";
import { describe, expect, it } from "vitest";

import {
  type CostBases,
  bumpCostBasis,
  reduceCostBasisProportionally,
} from "./costBasis";

const vault = "0x476310E34D2810f7d79C43A74E4D79405bd7a925" as Address;
const otherVault = "0x0cB9D84d4bcEc8d3D5B2d99a6F07f4605325987e" as Address;

describe("bumpCostBasis", function () {
  it("returns undefined when the cache is not populated", function () {
    expect(
      bumpCostBasis({
        assets: 100n,
        costBases: undefined,
        stakingVaultAddress: vault,
      }),
    ).toBeUndefined();
  });

  it("adds the deposited assets to the vault's cost basis", function () {
    expect(
      bumpCostBasis({
        assets: 50n,
        costBases: { [vault]: 100n },
        stakingVaultAddress: vault,
      }),
    ).toEqual({ [vault]: 150n });
  });

  it("treats a missing vault entry as zero", function () {
    expect(
      bumpCostBasis({
        assets: 396n,
        costBases: { [otherVault]: 10n },
        stakingVaultAddress: vault,
      }),
    ).toEqual({ [otherVault]: 10n, [vault]: 396n });
  });

  it("does not mutate the input", function () {
    const costBases: CostBases = { [vault]: 100n };
    bumpCostBasis({ assets: 50n, costBases, stakingVaultAddress: vault });
    expect(costBases).toEqual({ [vault]: 100n });
  });
});

describe("reduceCostBasisProportionally", function () {
  it("returns undefined when the cache is not populated", function () {
    expect(
      reduceCostBasisProportionally({
        assets: 100n,
        costBases: undefined,
        stakedBefore: 1000n,
        stakingVaultAddress: vault,
      }),
    ).toBeUndefined();
  });

  it("leaves the cache untouched when the staked total is unknown", function () {
    const costBases: CostBases = { [vault]: 900n };
    expect(
      reduceCostBasisProportionally({
        assets: 500n,
        costBases,
        stakedBefore: undefined,
        stakingVaultAddress: vault,
      }),
    ).toBe(costBases);
  });

  it("leaves the cache untouched when the staked total is zero", function () {
    const costBases: CostBases = { [vault]: 900n };
    expect(
      reduceCostBasisProportionally({
        assets: 500n,
        costBases,
        stakedBefore: 0n,
        stakingVaultAddress: vault,
      }),
    ).toBe(costBases);
  });

  it("reduces cost basis by the withdrawn proportion", function () {
    // Withdraw half of a 1000-staked position → cost basis halves.
    expect(
      reduceCostBasisProportionally({
        assets: 500n,
        costBases: { [vault]: 900n },
        stakedBefore: 1000n,
        stakingVaultAddress: vault,
      }),
    ).toEqual({ [vault]: 450n });
  });

  it("zeroes cost basis on a full withdrawal", function () {
    expect(
      reduceCostBasisProportionally({
        assets: 1000n,
        costBases: { [vault]: 900n },
        stakedBefore: 1000n,
        stakingVaultAddress: vault,
      }),
    ).toEqual({ [vault]: 0n });
  });

  it("clamps to zero when withdrawing more than the staked total", function () {
    expect(
      reduceCostBasisProportionally({
        assets: 1500n,
        costBases: { [vault]: 900n },
        stakedBefore: 1000n,
        stakingVaultAddress: vault,
      }),
    ).toEqual({ [vault]: 0n });
  });

  it("truncates toward zero (integer division)", function () {
    // 100 * (3 - 1) / 3 = 200 / 3 = 66.67 → 66
    expect(
      reduceCostBasisProportionally({
        assets: 1n,
        costBases: { [vault]: 100n },
        stakedBefore: 3n,
        stakingVaultAddress: vault,
      }),
    ).toEqual({ [vault]: 66n });
  });

  it("treats a missing vault entry as zero and preserves other vaults", function () {
    expect(
      reduceCostBasisProportionally({
        assets: 500n,
        costBases: { [otherVault]: 42n },
        stakedBefore: 1000n,
        stakingVaultAddress: vault,
      }),
    ).toEqual({ [otherVault]: 42n, [vault]: 0n });
  });
});
