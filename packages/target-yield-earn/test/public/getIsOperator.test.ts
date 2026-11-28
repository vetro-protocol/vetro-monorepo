import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { getIsOperator } from "../../src/actions/public/getIsOperator.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1111111111111111111111111111111111111111" as Address,
  controller: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
  operator: "0x1234567890123456789012345678901234567890" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("getIsOperator", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      getIsOperator(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(getIsOperator(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it.each([
    { field: "address", message: "Vault address is invalid" },
    { field: "controller", message: "Controller address is invalid" },
    { field: "operator", message: "Operator address is invalid" },
  ])(
    "should throw an error if the $field is not valid",
    async function ({ field, message }) {
      for (const value of ["invalid_address", zeroAddress]) {
        await expect(
          // @ts-expect-error - Testing invalid input
          getIsOperator(client, { ...validParameters, [field]: value }),
        ).rejects.toThrow(message);
      }
    },
  );

  it("should return whether the operator is approved by the controller", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(true);

    const isOperator = await getIsOperator(client, validParameters);

    expect(isOperator).toBe(true);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.controller, validParameters.operator],
      functionName: "isOperator",
    });
  });
});
