import type { Address, Client } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getLatestPrice } from "../src/chainlink.ts";

vi.mock("viem/actions", () => ({ readContract: vi.fn() }));

const address: Address = "0x0000000000000000000000000000000000000031";
const client = {} as Client;

const mockOracle = ({
  answer,
  decimals = 8,
  updatedAt,
}: {
  answer: bigint;
  decimals?: number;
  updatedAt: bigint;
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
          : [1n, answer, 0n, updatedAt, 1n],
      )) as never);

describe("getLatestPrice", function () {
  it("returns the price, its decimals and when it was updated", async function () {
    mockOracle({ answer: 99_950_000n, updatedAt: 1_700_000_000n });

    expect(await getLatestPrice({ address, client })).toEqual({
      decimals: 8,
      price: 99_950_000n,
      updatedAt: 1_700_000_000n,
    });
  });

  it("reads the latest round data and decimals of the given oracle", async function () {
    mockOracle({ answer: 1n, decimals: 18, updatedAt: 1n });

    const result = await getLatestPrice({ address, client });

    expect(result.decimals).toBe(18);
    expect(vi.mocked(readContract)).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address,
      functionName: "latestRoundData",
    });
    expect(vi.mocked(readContract)).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address,
      functionName: "decimals",
    });
  });

  it.each([
    ["is far from par", 50_000_000n, 1_700_000_000n],
    ["was updated long ago", 100_000_000n, 1n],
    ["is not positive", 0n, 1_700_000_000n],
    ["is negative", -1n, 1_700_000_000n],
  ])("does not throw when the price %s", async function (_, answer, updatedAt) {
    mockOracle({ answer, updatedAt });

    expect(await getLatestPrice({ address, client })).toEqual({
      decimals: 8,
      price: answer,
      updatedAt,
    });
  });
});
