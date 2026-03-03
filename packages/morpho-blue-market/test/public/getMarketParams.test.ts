import {
  type Address,
  type Client,
  type Hash,
  zeroAddress,
  zeroHash,
} from "viem";
import { readContract } from "viem/actions";
import { sepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { getMarketParams } from "../../src/actions/public/getMarketParams";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const mockClient = {
  chain: sepolia,
} as unknown as Client;

const mockAddress = "0x3333333333333333333333333333333333333333" as Address;

const mockMarketId =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as Hash;

const mockContractResult = [
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", // loanToken
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", // collateralToken
  "0xcccccccccccccccccccccccccccccccccccccccc", // oracle
  "0xdddddddddddddddddddddddddddddddddddddd", // irm
  BigInt(900000000000000000), // lltv
] as const;

describe("getMarketParams", function () {
  it("should throw if client is not defined", async function () {
    await expect(
      getMarketParams({
        address: mockAddress,
        // @ts-expect-error - Testing invalid input
        client: undefined,
        marketId: mockMarketId,
      }),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw if Morpho address is invalid", async function () {
    await expect(
      getMarketParams({
        // @ts-expect-error - Testing invalid input
        address: "invalid",
        client: mockClient,
        marketId: mockMarketId,
      }),
    ).rejects.toThrow("Invalid Morpho address");
  });

  it("should throw if Morpho address is zero address", async function () {
    await expect(
      getMarketParams({
        address: zeroAddress,
        client: mockClient,
        marketId: mockMarketId,
      }),
    ).rejects.toThrow("Invalid Morpho address");
  });

  it("should throw if market ID is zero hash", async function () {
    await expect(
      getMarketParams({
        address: mockAddress,
        client: mockClient,
        marketId: zeroHash,
      }),
    ).rejects.toThrow("Market ID cannot be empty or zero");
  });

  it("should return market params from contract", async function () {
    vi.mocked(readContract).mockResolvedValue(mockContractResult);

    const result = await getMarketParams({
      address: mockAddress,
      client: mockClient,
      marketId: mockMarketId,
    });

    expect(readContract).toHaveBeenCalledExactlyOnceWith(mockClient, {
      abi: expect.any(Array),
      address: mockAddress,
      args: [mockMarketId],
      functionName: "idToMarketParams",
    });

    expect(result).toEqual({
      collateralToken: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      irm: "0xdddddddddddddddddddddddddddddddddddddd",
      lltv: BigInt(900000000000000000),
      loanToken: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      oracle: "0xcccccccccccccccccccccccccccccccccccccccc",
    });
  });

  it("should propagate errors from readContract", async function () {
    vi.mocked(readContract).mockRejectedValue(
      new Error("Failed to read contract"),
    );

    await expect(
      getMarketParams({
        address: mockAddress,
        client: mockClient,
        marketId: mockMarketId,
      }),
    ).rejects.toThrow("Failed to read contract");
  });
});
