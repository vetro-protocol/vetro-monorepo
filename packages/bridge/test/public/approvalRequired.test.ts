import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { approvalRequired } from "../../src/actions/public/approvalRequired";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  oftAddress: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("approvalRequired", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      approvalRequired(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(approvalRequired(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if oftAddress is invalid", async function () {
    const parameters = { oftAddress: "not_an_address" };
    // @ts-expect-error - Testing invalid input
    await expect(approvalRequired(client, parameters)).rejects.toThrow(
      "OFT address is invalid",
    );
  });

  it("should throw an error if oftAddress is zero address", async function () {
    await expect(
      approvalRequired(client, { oftAddress: zeroAddress }),
    ).rejects.toThrow("OFT address is invalid");
  });

  it("should call readContract and return the boolean result", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(true);

    const result = await approvalRequired(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.oftAddress,
      functionName: "approvalRequired",
    });
    expect(result).toBe(true);
  });
});
