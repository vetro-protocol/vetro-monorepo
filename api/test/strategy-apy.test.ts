import { knownTokens } from "@vetro-protocol/core";
import type { Hash } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getVaultNetApys as getLagoonApys } from "../src/lagoon.ts";
import type { StakeDaoStrategy } from "../src/liquidity/stake-dao.ts";
import { getLiveOpportunities } from "../src/merkl.ts";
import { getVaultNetApys as getMorphoApys } from "../src/morpho.ts";
import {
  combineStrategyApy,
  getStrategyApy,
  merklApr,
} from "../src/strategy-apy.ts";

vi.mock("../src/merkl.ts", () => ({
  getLiveOpportunities: vi.fn(),
}));

vi.mock("../src/lagoon.ts", () => ({
  getVaultNetApys: vi.fn(),
}));

vi.mock("../src/morpho.ts", () => ({
  getVaultNetApys: vi.fn(),
}));

const findToken = (symbol: string) =>
  knownTokens.find((token) => token.symbol === symbol)!;

const nowSeconds = 1_000_000;
const receiptToken = findToken("sVUSD").address;
const otherToken = findToken("CRV").address;

const campaign = ({
  apr,
  endTimestamp = nowSeconds + 100,
  startTimestamp = nowSeconds - 100,
}: {
  apr: number;
  endTimestamp?: number;
  startTimestamp?: number;
}) => ({
  apr,
  campaignId: `0x${"1".repeat(64)}` as Hash,
  endTimestamp,
  rewardToken: { address: otherToken, chainId: 1 },
  startTimestamp,
});

const stakeDaoStrategy: StakeDaoStrategy = {
  apr: { current: { total: 3.6 } },
  chainId: 1,
  gaugeAddress: null,
  key: "1-0xstrategy",
  lpToken: { address: receiptToken },
  rewards: [],
  tradingApy: 0.1,
};

const strategyAddress = findToken("VUSD").address;
const strategyReceiptToken = findToken("sVUSD").address;
const strategyApyKey = `analytics:treasury:apy:${strategyAddress.toLowerCase()}`;

function createFakeKv({
  cachedApy,
  getError,
  putError,
}: {
  cachedApy?: number;
  getError?: Error;
  putError?: Error;
}) {
  const values = new Map<string, number>();
  if (cachedApy !== undefined) {
    values.set(strategyApyKey, cachedApy);
  }
  const get = vi.fn(async function (key: string) {
    if (getError) {
      throw getError;
    }
    return values.get(key) ?? null;
  });
  const put = vi.fn(async function (key: string, serializedApy: string) {
    if (putError) {
      throw putError;
    }
    values.set(key, JSON.parse(serializedApy) as number);
  });
  return {
    kv: { get, put } as unknown as KVNamespace,
    put,
  };
}

const getStrategyApys = ({
  kv,
  receiptTokenOverride = strategyReceiptToken,
  stakeDaoStrategies = [],
}: {
  kv: KVNamespace;
  receiptTokenOverride?: typeof strategyReceiptToken | null;
  stakeDaoStrategies?: StakeDaoStrategy[] | null;
}) =>
  getStrategyApy({
    kv,
    stakeDaoStrategies,
    strategies: [
      {
        address: strategyAddress,
        receiptToken:
          receiptTokenOverride === null ? undefined : receiptTokenOverride,
      },
    ],
  });

beforeEach(function () {
  vi.mocked(getLiveOpportunities).mockResolvedValue([]);
  vi.mocked(getLagoonApys).mockResolvedValue([]);
  vi.mocked(getMorphoApys).mockResolvedValue([
    { address: strategyReceiptToken, apy: 4 },
  ]);
});

describe("strategy-apy/merklApr", function () {
  it("adds the APR of the live campaigns of the receipt token", function () {
    const opportunities = [
      {
        campaigns: [
          campaign({ apr: 0.5 }),
          campaign({ apr: 0.25 }),
          campaign({ apr: 9, endTimestamp: nowSeconds }),
          campaign({ apr: 9, startTimestamp: nowSeconds + 1 }),
        ],
        chainId: 1,
        id: "1",
        identifier: receiptToken.toLowerCase() as `0x${string}`,
      },
      {
        campaigns: [campaign({ apr: 9 })],
        chainId: 1,
        id: "2",
        identifier: otherToken,
      },
    ];
    expect(merklApr({ nowSeconds, opportunities, receiptToken })).toBe(0.75);
  });

  it("returns 0 when no opportunity targets the receipt token", function () {
    expect(merklApr({ nowSeconds, opportunities: [], receiptToken })).toBe(0);
  });
});

describe("strategy-apy/combineStrategyApy", function () {
  const morphoToken = findToken("USDC").address;
  const lagoonToken = findToken("USDT").address;
  const receiptTokens = [morphoToken, lagoonToken, receiptToken].map(
    (token) => ({ receiptToken: token, strategy: token }),
  );
  const opportunities = [
    {
      campaigns: [campaign({ apr: 0.5 })],
      chainId: 1,
      id: "1",
      identifier: morphoToken,
    },
  ];

  it("adds the incentives to the native APY of each source", function () {
    expect(
      combineStrategyApy({
        nowSeconds,
        opportunities,
        receiptTokens,
        stakeDaoStrategies: [stakeDaoStrategy],
        vaultApys: [
          { address: lagoonToken, apy: 0 },
          { address: morphoToken, apy: 4 },
        ],
      }),
    ).toEqual({
      [lagoonToken]: 0,
      [morphoToken]: 4.5,
      [receiptToken]: 3.6,
    });
  });

  it("omits only the strategies whose source has no APY", function () {
    expect(
      combineStrategyApy({
        nowSeconds,
        opportunities,
        receiptTokens,
        stakeDaoStrategies: [stakeDaoStrategy],
        vaultApys: [{ address: lagoonToken, apy: 2 }],
      }),
    ).toEqual({
      [lagoonToken]: 2,
      [receiptToken]: 3.6,
    });
  });
});

describe("strategy-apy/getStrategyApy", function () {
  it("returns and caches a fresh APY for one hour", async function () {
    const { kv, put } = createFakeKv({});

    const result = await getStrategyApys({ kv });

    expect(result).toEqual({ [strategyAddress]: 4 });
    expect(put).toHaveBeenCalledWith(strategyApyKey, JSON.stringify(4), {
      expirationTtl: 60 * 60,
    });
  });

  it("uses the cached APY when Merkl fails, even if a native APY is available", async function () {
    const { kv, put } = createFakeKv({ cachedApy: 8 });
    vi.mocked(getLiveOpportunities).mockRejectedValue(new Error("Merkl down"));

    const result = await getStrategyApys({ kv });

    expect(result).toEqual({ [strategyAddress]: 8 });
    expect(put).not.toHaveBeenCalled();
  });

  it.each(["Morpho", "Lagoon"])(
    "uses the cached APY when the %s source fails",
    async function (source) {
      const { kv } = createFakeKv({ cachedApy: 8 });
      if (source === "Morpho") {
        vi.mocked(getMorphoApys).mockRejectedValue(new Error("Morpho down"));
      } else {
        vi.mocked(getMorphoApys).mockResolvedValue([]);
        vi.mocked(getLagoonApys).mockRejectedValue(new Error("Lagoon down"));
      }

      const result = await getStrategyApys({ kv });

      expect(result).toEqual({ [strategyAddress]: 8 });
    },
  );

  it("uses the cached APY when the StakeDAO strategies are unavailable", async function () {
    const { kv } = createFakeKv({ cachedApy: 8 });
    vi.mocked(getMorphoApys).mockResolvedValue([]);

    const result = await getStrategyApys({ kv, stakeDaoStrategies: null });

    expect(result).toEqual({ [strategyAddress]: 8 });
  });

  it("omits APY when all sources respond but none reports one", async function () {
    const { kv } = createFakeKv({ cachedApy: 8 });
    vi.mocked(getMorphoApys).mockResolvedValue([]);

    const result = await getStrategyApys({ kv });

    expect(result).toEqual({});
  });

  it("continues when cached APY reads and writes fail", async function () {
    const kv = createFakeKv({
      getError: new Error("KV read failed"),
      putError: new Error("KV write failed"),
    });

    const result = await getStrategyApys({ kv: kv.kv });

    expect(result).toEqual({ [strategyAddress]: 4 });
  });

  it("uses the cached APY when the receipt-token read fails", async function () {
    const { kv } = createFakeKv({ cachedApy: 8 });

    const result = await getStrategyApys({ kv, receiptTokenOverride: null });

    expect(result).toEqual({ [strategyAddress]: 8 });
  });

  it("uses the cached APY when Merkl returns malformed campaigns", async function () {
    const { kv, put } = createFakeKv({ cachedApy: 8 });
    vi.mocked(getLiveOpportunities).mockResolvedValue([
      {
        // @ts-expect-error Deliberately malformed upstream campaigns exercise the cache fallback.
        campaigns: null,
        chainId: 1,
        id: "malformed-opportunity",
        identifier: strategyReceiptToken,
      },
    ]);

    const result = await getStrategyApys({ kv });

    expect(result).toEqual({ [strategyAddress]: 8 });
    expect(put).not.toHaveBeenCalled();
  });

  it("uses the cached APY without writing when a live Merkl campaign has no APR", async function () {
    const { kv, put } = createFakeKv({ cachedApy: 8 });
    const now = Math.floor(Date.now() / 1000);
    vi.mocked(getLiveOpportunities).mockResolvedValue([
      {
        campaigns: [
          // @ts-expect-error Deliberately missing APR exercises non-finite APY fallback.
          {
            campaignId: `0x${"1".repeat(64)}`,
            endTimestamp: now + 100,
            rewardToken: { address: otherToken, chainId: 1 },
            startTimestamp: now - 100,
          },
        ],
        chainId: 1,
        id: "missing-apr",
        identifier: strategyReceiptToken,
      },
    ]);

    const result = await getStrategyApys({ kv });

    expect(result).toEqual({ [strategyAddress]: 8 });
    expect(put).not.toHaveBeenCalled();
  });
});
