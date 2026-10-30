import { type Address, checksumAddress } from "viem";
import { describe, expect, it, vi } from "vitest";

import * as graphql from "../../src/graphql.ts";
import { getCostBasis } from "../../src/hemi-earn/cost-basis.ts";
import { resolveShareByAsset } from "../../src/hemi-earn/router.ts";

vi.mock("../../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

vi.mock("../../src/hemi-earn/router.ts", () => ({
  createHemiClient: vi.fn(() => ({})),
  resolveShareByAsset: vi.fn(),
}));

const indexer = { url: "http://localhost:8080/v1/graphql" };
const rpcUrl = undefined;
const account = "0x00000000000000000000000000000000000000a1";
const other = "0x00000000000000000000000000000000000000b2";

const assetA = "0x00000000000000000000000000000000000000c1";
const assetB = "0x00000000000000000000000000000000000000c2";
const shareA = "0x00000000000000000000000000000000000000d1";
const shareB = "0x00000000000000000000000000000000000000d2";

type RateRow = {
  asset: string;
  rateDenominator: string;
  rateNumerator: string;
  timestamp: string;
};

const deposit = ({
  asset,
  requestedAt,
  shares,
  staked,
  timestamp,
}: {
  asset: string;
  requestedAt?: string;
  shares: string;
  staked: string;
  timestamp: string;
}) => ({
  amountIn: null,
  amountOut: shares,
  asset,
  kind: "DEPOSIT",
  processedAt: timestamp,
  requestedAt: requestedAt ?? timestamp,
  stakedAmount: staked,
});

const redeem = ({
  asset,
  processedAt,
  shares,
  timestamp,
}: {
  asset: string;
  processedAt?: string | null;
  shares: string;
  timestamp: string;
}) => ({
  amountIn: shares,
  amountOut: null,
  asset,
  kind: "REDEEM",
  processedAt: processedAt === undefined ? timestamp : processedAt,
  requestedAt: timestamp,
  stakedAmount: null,
});

const transfer = ({
  from,
  share,
  timestamp,
  to,
  value,
}: {
  from: string;
  share: string;
  timestamp: string;
  to: string;
  value: string;
}) => ({ from, share, timestamp, to, value });

function configure({
  assets = [],
  rates = [],
  requests = [],
  shareByAsset = {},
  transfers = [],
}: {
  assets?: string[];
  rates?: RateRow[];
  requests?: unknown[];
  shareByAsset?: Record<string, string>;
  transfers?: unknown[];
}) {
  vi.mocked(resolveShareByAsset).mockImplementation(
    async ({ asset }) => shareByAsset[asset] ?? null,
  );
  vi.mocked(graphql.runQuery).mockImplementation(async function ({
    query,
    variables,
  }) {
    if (query.includes("GetEarnCostBasis")) {
      return { Request: requests };
    }
    if (query.includes("GetShareTransfers")) {
      return { ShareTransfer: transfers };
    }
    if (query.includes("GetEarnAssets")) {
      return { RateSnapshot: assets.map((asset) => ({ asset })) };
    }
    if (query.includes("GetRateBound")) {
      const rateAssets = variables?.assets as string[];
      const below = query.includes("_lte");
      const timestamp = BigInt(String(variables?.timestamp));
      const matches = rates
        .filter(
          (rate) =>
            rateAssets.includes(rate.asset) &&
            (below
              ? BigInt(rate.timestamp) <= timestamp
              : BigInt(rate.timestamp) >= timestamp),
        )
        .sort((a, b) => Number(BigInt(a.timestamp) - BigInt(b.timestamp)));
      const rate = below ? matches.at(-1) : matches[0];
      return { RateSnapshot: rate ? [rate] : [] };
    }
    throw new Error(`Unexpected query: ${query}`);
  });
}

const queriedWith = (name: string) =>
  vi
    .mocked(graphql.runQuery)
    .mock.calls.some(([{ query }]) => query.includes(name));

describe("hemi-earn/cost-basis/getCostBasis", function () {
  it("returns the cost basis of a processed deposit, keyed by the checksummed share", async function () {
    configure({
      requests: [
        deposit({
          asset: assetA,
          shares: "100",
          staked: "100",
          timestamp: "1000",
        }),
      ],
      shareByAsset: { [assetA]: shareA },
    });

    const result = await getCostBasis({ address: account, indexer, rpcUrl });

    expect(result).toEqual({ [checksumAddress(shareA as Address)]: "100" });
    expect(queriedWith("GetEarnAssets")).toBe(false);
  });

  it("prices a transfer in at the nearest rate", async function () {
    configure({
      assets: [assetA],
      rates: [
        {
          asset: assetA,
          rateDenominator: "100",
          rateNumerator: "105",
          timestamp: "1000",
        },
      ],
      shareByAsset: { [assetA]: shareA },
      transfers: [
        transfer({
          from: other,
          share: shareA,
          timestamp: "1000",
          to: account,
          value: "10",
        }),
      ],
    });

    const result = await getCostBasis({ address: account, indexer, rpcUrl });

    expect(result).toEqual({ [checksumAddress(shareA as Address)]: "10.5" });
    expect(queriedWith("GetEarnAssets")).toBe(true);
  });

  it("drops a share after a full redeem", async function () {
    configure({
      requests: [
        deposit({
          asset: assetA,
          shares: "100",
          staked: "100",
          timestamp: "1000",
        }),
        redeem({ asset: assetA, shares: "100", timestamp: "2000" }),
        deposit({
          asset: assetB,
          shares: "50",
          staked: "50",
          timestamp: "1000",
        }),
      ],
      shareByAsset: { [assetA]: shareA, [assetB]: shareB },
    });

    const result = await getCostBasis({ address: account, indexer, rpcUrl });

    expect(result).toEqual({ [checksumAddress(shareB as Address)]: "50" });
  });

  it("reduces the cost basis by a redeem that is not processed yet", async function () {
    configure({
      requests: [
        deposit({
          asset: assetA,
          shares: "100",
          staked: "100",
          timestamp: "1000",
        }),
        redeem({
          asset: assetA,
          processedAt: null,
          shares: "40",
          timestamp: "1100",
        }),
      ],
      shareByAsset: { [assetA]: shareA },
      transfers: [
        transfer({
          from: account,
          share: shareA,
          timestamp: "1200",
          to: other,
          value: "60",
        }),
      ],
    });

    const result = await getCostBasis({ address: account, indexer, rpcUrl });

    expect(result).toEqual({});
  });

  it("applies a request before a transfer with the same timestamp", async function () {
    configure({
      requests: [
        deposit({
          asset: assetA,
          shares: "100",
          staked: "100",
          timestamp: "1000",
        }),
      ],
      shareByAsset: { [assetA]: shareA },
      transfers: [
        transfer({
          from: account,
          share: shareA,
          timestamp: "1000",
          to: other,
          value: "40",
        }),
      ],
    });

    const result = await getCostBasis({ address: account, indexer, rpcUrl });

    expect(result).toEqual({ [checksumAddress(shareA as Address)]: "60" });
  });

  it("applies a deposit when it is processed, not when it is requested", async function () {
    configure({
      requests: [
        deposit({
          asset: assetA,
          shares: "100",
          staked: "100",
          timestamp: "1000",
        }),
        deposit({
          asset: assetA,
          requestedAt: "1100",
          shares: "100",
          staked: "200",
          timestamp: "1300",
        }),
      ],
      shareByAsset: { [assetA]: shareA },
      transfers: [
        transfer({
          from: account,
          share: shareA,
          timestamp: "1200",
          to: other,
          value: "50",
        }),
      ],
    });

    const result = await getCostBasis({ address: account, indexer, rpcUrl });

    expect(result).toEqual({ [checksumAddress(shareA as Address)]: "250" });
  });

  it("prices a transfer at the nearest rate of all the assets of its share", async function () {
    configure({
      assets: [assetB, assetA],
      rates: [
        {
          asset: assetA,
          rateDenominator: "100",
          rateNumerator: "105",
          timestamp: "1000",
        },
        {
          asset: assetB,
          rateDenominator: "100",
          rateNumerator: "110",
          timestamp: "2000",
        },
      ],
      shareByAsset: { [assetA]: shareA, [assetB]: shareA },
      transfers: [
        transfer({
          from: other,
          share: shareA,
          timestamp: "1900",
          to: account,
          value: "10",
        }),
      ],
    });

    const result = await getCostBasis({ address: account, indexer, rpcUrl });

    expect(result).toEqual({ [checksumAddress(shareA as Address)]: "11" });
  });

  it("drops an asset that the Router does not know", async function () {
    configure({
      requests: [
        deposit({
          asset: assetA,
          shares: "100",
          staked: "100",
          timestamp: "1000",
        }),
        deposit({
          asset: assetB,
          shares: "50",
          staked: "50",
          timestamp: "1000",
        }),
      ],
      shareByAsset: { [assetA]: shareA },
    });

    const result = await getCostBasis({ address: account, indexer, rpcUrl });

    expect(result).toEqual({ [checksumAddress(shareA as Address)]: "100" });
  });

  it("fails when a Router read fails", async function () {
    configure({
      requests: [
        deposit({
          asset: assetA,
          shares: "100",
          staked: "100",
          timestamp: "1000",
        }),
      ],
    });
    vi.mocked(resolveShareByAsset).mockRejectedValue(new Error("rate limited"));

    await expect(
      getCostBasis({ address: account, indexer, rpcUrl }),
    ).rejects.toThrow("rate limited");
  });
});
