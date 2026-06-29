import { getYieldDistributor } from "@vetro-protocol/earn/actions";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import {
  getPeggedToken,
  getTreasury,
  previewRedeem as previewGatewayRedeem,
} from "@vetro-protocol/gateway/actions";
import {
  getWhitelistedTokens,
  getWithdrawable,
} from "@vetro-protocol/treasury/actions";
import { type Address, parseUnits } from "viem";
import { decimals, totalSupply } from "viem-erc20/actions";
import {
  balanceOf,
  previewRedeem as previewMetaRedeem,
  totalAssets,
} from "viem-erc4626/actions";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCollateralizationRatio,
  getStaked,
  getTvl,
} from "../src/analytics.ts";
import { findStakingVaultForPeggedToken } from "../src/staking-vault.ts";

vi.mock("../src/mainnet-client.ts", () => ({
  createMainnetClient: vi.fn(() => ({})),
}));

vi.mock("../src/staking-vault.ts", () => ({
  findStakingVaultForPeggedToken: vi.fn(),
}));

vi.mock("@vetro-protocol/earn/actions", () => ({
  getYieldDistributor: vi.fn(),
}));

vi.mock("@vetro-protocol/gateway/actions", () => ({
  getPeggedToken: vi.fn(),
  getTreasury: vi.fn(),
  previewRedeem: vi.fn(),
}));

vi.mock("@vetro-protocol/treasury/actions", () => ({
  getTokenConfig: vi.fn(),
  getWhitelistedTokens: vi.fn(),
  getWithdrawable: vi.fn(),
}));

vi.mock("viem-erc20/actions", () => ({
  decimals: vi.fn(),
  totalSupply: vi.fn(),
}));

vi.mock("viem-erc4626/actions", () => ({
  balanceOf: vi.fn(),
  previewRedeem: vi.fn(),
  totalAssets: vi.fn(),
}));

// The primary gateway: getStrategicReserves only runs its on-chain path for
// gatewayAddresses[0], returning 0 for any other gateway.
const gatewayAddress = gatewayAddresses[0];
const peggedTokenAddress: Address =
  "0x0000000000000000000000000000000000000001";
const treasuryAddress: Address = "0x0000000000000000000000000000000000000002";
const yieldDistributorAddress: Address =
  "0x0000000000000000000000000000000000000003";
const usdcAddress: Address = "0x0000000000000000000000000000000000000004";
const usdtAddress: Address = "0x0000000000000000000000000000000000000005";

const url = "https://rpc.example";

// Per-account pegged-token balances feeding getSurplus, keyed by account.
let surplusBalances: Partial<Record<Address, bigint>>;
// Strategic reserves value (the meta-vault previewRedeem result).
let strategicReserves: bigint;
// Per whitelisted token: withdrawable amount and the gateway redeem rate.
let withdrawables: Partial<Record<Address, bigint>>;
let gatewayRates: Partial<Record<Address, bigint>>;

const run = () => getCollateralizationRatio({ gatewayAddress, url });

beforeEach(function () {
  surplusBalances = {};
  strategicReserves = 0n;
  withdrawables = {};
  gatewayRates = {};

  vi.mocked(getPeggedToken).mockResolvedValue(peggedTokenAddress);
  vi.mocked(getTreasury).mockResolvedValue(treasuryAddress);
  vi.mocked(decimals).mockResolvedValue(18);
  vi.mocked(findStakingVaultForPeggedToken).mockResolvedValue(
    "0x0000000000000000000000000000000000000006",
  );
  vi.mocked(getYieldDistributor).mockResolvedValue(yieldDistributorAddress);
  vi.mocked(totalSupply).mockResolvedValue(0n);
  vi.mocked(totalAssets).mockResolvedValue(0n);
  vi.mocked(getWhitelistedTokens).mockResolvedValue([]);

  // Surplus reads the pegged token's balance across several accounts; only the
  // configured account contributes, everything else is zero. The meta-vault
  // balance reads (for strategic reserves) are also routed here but ignored,
  // since previewMetaRedeem below returns the strategic value directly.
  vi.mocked(balanceOf).mockImplementation(
    async (_client, { account }) => surplusBalances[account] ?? 0n,
  );
  // getStrategicReserves redeems the accumulated meta shares; the mock returns
  // the configured strategic reserves regardless of the share amount.
  vi.mocked(previewMetaRedeem).mockImplementation(
    async () => strategicReserves,
  );

  vi.mocked(getWithdrawable).mockImplementation(
    async (_client, { token }) => withdrawables[token] ?? 0n,
  );
  vi.mocked(previewGatewayRedeem).mockImplementation(
    async (_client, { tokenOut }) => gatewayRates[tokenOut] ?? 0n,
  );
});

describe("analytics/getCollateralizationRatio", function () {
  it("returns zero amounts and a zero ratio when everything is empty", async function () {
    const result = await run();

    expect(result).toEqual({
      ratio: 0,
      strategicReserves: 0n,
      supply: 0n,
      surplus: 0n,
      total: 0n,
      treasuryTotal: 0n,
    });
  });

  it("computes the ratio from strategic reserves and surplus with no treasury", async function () {
    strategicReserves = parseUnits("80", 18);
    surplusBalances[treasuryAddress] = parseUnits("20", 18);
    vi.mocked(totalSupply).mockResolvedValue(parseUnits("100", 18));

    const result = await run();

    expect(result.strategicReserves).toBe(parseUnits("80", 18));
    expect(result.surplus).toBe(parseUnits("20", 18));
    expect(result.treasuryTotal).toBe(0n);
    expect(result.total).toBe(parseUnits("100", 18));
    expect(result.supply).toBe(parseUnits("100", 18));
    expect(result.ratio).toBe(100);
  });

  it("includes treasury holdings converted via the gateway previewRedeem rate", async function () {
    strategicReserves = parseUnits("50", 18);
    surplusBalances[treasuryAddress] = parseUnits("10", 18);
    vi.mocked(totalSupply).mockResolvedValue(parseUnits("100", 18));
    vi.mocked(getWhitelistedTokens).mockResolvedValue([usdcAddress]);
    // 40 USDC withdrawable, 1 VUSD redeems for 1 USDC → 40 VUSD of backing.
    withdrawables[usdcAddress] = parseUnits("40", 6);
    gatewayRates[usdcAddress] = parseUnits("1", 6);

    const result = await run();

    expect(result.treasuryTotal).toBe(parseUnits("40", 18));
    expect(result.total).toBe(parseUnits("100", 18));
    expect(result.ratio).toBe(100);
  });

  it("sums multiple whitelisted treasury tokens", async function () {
    strategicReserves = parseUnits("30", 18);
    surplusBalances[treasuryAddress] = parseUnits("10", 18);
    vi.mocked(totalSupply).mockResolvedValue(parseUnits("100", 18));
    vi.mocked(getWhitelistedTokens).mockResolvedValue([
      usdcAddress,
      usdtAddress,
    ]);
    withdrawables[usdcAddress] = parseUnits("20", 6);
    withdrawables[usdtAddress] = parseUnits("40", 6);
    gatewayRates[usdcAddress] = parseUnits("1", 6);
    gatewayRates[usdtAddress] = parseUnits("1", 6);

    const result = await run();

    expect(result.treasuryTotal).toBe(parseUnits("60", 18));
    expect(result.total).toBe(parseUnits("100", 18));
    expect(result.ratio).toBe(100);
  });

  it("skips treasury tokens whose redeem rate is zero", async function () {
    strategicReserves = parseUnits("50", 18);
    surplusBalances[treasuryAddress] = parseUnits("10", 18);
    vi.mocked(totalSupply).mockResolvedValue(parseUnits("100", 18));
    vi.mocked(getWhitelistedTokens).mockResolvedValue([usdcAddress]);
    withdrawables[usdcAddress] = parseUnits("40", 18);
    gatewayRates[usdcAddress] = 0n;

    const result = await run();

    expect(result.treasuryTotal).toBe(0n);
    expect(result.total).toBe(parseUnits("60", 18));
    expect(result.ratio).toBe(60);
  });

  it("returns a fractional ratio when over-collateralized", async function () {
    // 100.04 VUSD backing against 100 VUSD supply → 100.04%.
    strategicReserves = parseUnits("100.04", 18);
    vi.mocked(totalSupply).mockResolvedValue(parseUnits("100", 18));

    const result = await run();

    expect(result.total).toBe(parseUnits("100.04", 18));
    expect(result.ratio).toBeCloseTo(100.04, 10);
  });

  it("returns a zero ratio when supply is zero even with backing", async function () {
    strategicReserves = parseUnits("50", 18);
    vi.mocked(totalSupply).mockResolvedValue(0n);

    const result = await run();

    expect(result.total).toBe(parseUnits("50", 18));
    expect(result.supply).toBe(0n);
    expect(result.ratio).toBe(0);
  });

  it("returns raw bigint amounts (the route stringifies them)", async function () {
    strategicReserves = parseUnits("1", 18);
    vi.mocked(totalSupply).mockResolvedValue(parseUnits("1", 18));

    const result = await run();

    expect(typeof result.strategicReserves).toBe("bigint");
    expect(typeof result.supply).toBe("bigint");
    expect(typeof result.total).toBe("bigint");
    expect(typeof result.ratio).toBe("number");
  });
});

describe("analytics/getTvl", function () {
  const runTvl = () => getTvl({ gatewayAddress, url });

  it("returns the pegged token's minted total supply", async function () {
    vi.mocked(totalSupply).mockResolvedValue(parseUnits("11425000", 18));

    const result = await runTvl();

    expect(getPeggedToken).toHaveBeenCalledWith(expect.anything(), {
      address: gatewayAddress,
    });
    expect(result).toEqual({ minted: parseUnits("11425000", 18) });
  });

  it("returns a zero minted amount when supply is zero", async function () {
    vi.mocked(totalSupply).mockResolvedValue(0n);

    const result = await runTvl();

    expect(result).toEqual({ minted: 0n });
  });

  it("returns a raw bigint amount (the route stringifies it)", async function () {
    vi.mocked(totalSupply).mockResolvedValue(parseUnits("1", 18));

    const result = await runTvl();

    expect(typeof result.minted).toBe("bigint");
  });
});

describe("analytics/getStaked", function () {
  const runStaked = () => getStaked({ gatewayAddress, url });

  it("returns the staking vault's total assets", async function () {
    vi.mocked(totalAssets).mockResolvedValue(parseUnits("4200000", 18));

    const result = await runStaked();

    expect(findStakingVaultForPeggedToken).toHaveBeenCalledWith({
      client: expect.anything(),
      peggedTokenAddress,
    });
    expect(result).toEqual({ staked: parseUnits("4200000", 18) });
  });

  it("returns a zero staked amount when the vault is empty", async function () {
    vi.mocked(totalAssets).mockResolvedValue(0n);

    const result = await runStaked();

    expect(result).toEqual({ staked: 0n });
  });

  it("returns a raw bigint amount (the route stringifies it)", async function () {
    vi.mocked(totalAssets).mockResolvedValue(parseUnits("1", 18));

    const result = await runStaked();

    expect(typeof result.staked).toBe("bigint");
  });
});
