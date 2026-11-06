import type { Address, Client } from "viem";
import { readContract } from "viem/actions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getFreshPrice } from "../src/chainlink.ts";

vi.mock("viem/actions", () => ({ readContract: vi.fn() }));

const address: Address = "0x0000000000000000000000000000000000000031";
const client = {} as Client;
const now = 1_700_000_000;
const stalePeriod = 3_600n;

const mockOracle = ({
  answer,
  decimals = 8,
  updatedAt,
}: {
  answer: bigint;
  decimals?: number;
  updatedAt: number;
}) =>
  vi
    .mocked(readContract)
    .mockImplementation(((
      _client: Client,
      { functionName }: { functionName: string },
    ) =>
      Promise.resolve(
        functionName === "decimals"
          ? decimals
          : [1n, answer, 0n, BigInt(updatedAt), 1n],
      )) as never);

describe("getFreshPrice", function () {
  beforeEach(function () {
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);
  });

  afterEach(function () {
    vi.useRealTimers();
  });

  it("returns the price and its decimals", async function () {
    mockOracle({
      answer: 99_950_000n,
      updatedAt: now - 60,
    });

    expect(await getFreshPrice({ address, client, stalePeriod })).toEqual({
      decimals: 8,
      price: 99_950_000n,
    });
  });

  it("does not fail when the price is far from par", async function () {
    mockOracle({ answer: 50_000_000n, updatedAt: now });

    expect(await getFreshPrice({ address, client, stalePeriod })).toEqual({
      decimals: 8,
      price: 50_000_000n,
    });
  });

  it("accepts a price updated exactly stalePeriod seconds ago", async function () {
    mockOracle({
      answer: 100_000_000n,
      updatedAt: now - Number(stalePeriod),
    });

    await expect(
      getFreshPrice({ address, client, stalePeriod }),
    ).resolves.toBeDefined();
  });

  it("fails when the price is older than stalePeriod", async function () {
    mockOracle({
      answer: 100_000_000n,
      updatedAt: now - Number(stalePeriod) - 1,
    });

    await expect(
      getFreshPrice({ address, client, stalePeriod }),
    ).rejects.toThrow("Stale oracle price");
  });

  it("fails when the price is not positive", async function () {
    mockOracle({ answer: 0n, updatedAt: now });

    await expect(
      getFreshPrice({ address, client, stalePeriod }),
    ).rejects.toThrow("Invalid oracle price");
  });
});
