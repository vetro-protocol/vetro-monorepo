import { type Address, type Client, type Hex, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { verifyTermsSignature } from "../../src/actions/public/verifyTermsSignature.ts";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  address: "0x1111111111111111111111111111111111111111" as Address,
  claimant: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
  recipient: "0x1234567890123456789012345678901234567890" as Address,
  signature: "0xabcd" as Hex,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("verifyTermsSignature", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      verifyTermsSignature(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(verifyTermsSignature(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(verifyTermsSignature(client, parameters)).rejects.toThrow(
      "Distributor address is invalid",
    );
  });

  it("should throw an error if the address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(verifyTermsSignature(client, parameters)).rejects.toThrow(
      "Distributor address is invalid",
    );
  });

  it("should throw an error if the claimant is not valid", async function () {
    const parameters = {
      ...validParameters,
      claimant: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(verifyTermsSignature(client, parameters)).rejects.toThrow(
      "Claimant address is invalid",
    );
  });

  it("should throw an error if the claimant is zero address", async function () {
    const parameters = {
      ...validParameters,
      claimant: zeroAddress,
    };

    await expect(verifyTermsSignature(client, parameters)).rejects.toThrow(
      "Claimant address is invalid",
    );
  });

  it("should throw an error if the recipient is not valid", async function () {
    const parameters = {
      ...validParameters,
      recipient: "invalid_address",
    };
    // @ts-expect-error - Testing invalid input
    await expect(verifyTermsSignature(client, parameters)).rejects.toThrow(
      "Recipient address is invalid",
    );
  });

  it("should throw an error if the recipient is zero address", async function () {
    const parameters = {
      ...validParameters,
      recipient: zeroAddress,
    };

    await expect(verifyTermsSignature(client, parameters)).rejects.toThrow(
      "Recipient address is invalid",
    );
  });

  it("should throw an error if the signature is not hex", async function () {
    const parameters = {
      ...validParameters,
      signature: "not_hex",
    };
    // @ts-expect-error - Testing invalid input
    await expect(verifyTermsSignature(client, parameters)).rejects.toThrow(
      "Signature must be hex",
    );
  });

  it("should accept an empty signature", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(false);

    const valid = await verifyTermsSignature(client, {
      ...validParameters,
      signature: "0x",
    });

    expect(valid).toBe(false);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [validParameters.claimant, validParameters.recipient, "0x"],
      functionName: "verifyTermsSignature",
    });
  });

  it("should return whether the terms signature is valid", async function () {
    vi.mocked(readContract).mockResolvedValueOnce(true);

    const valid = await verifyTermsSignature(client, validParameters);

    expect(valid).toBe(true);
    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.address,
      args: [
        validParameters.claimant,
        validParameters.recipient,
        validParameters.signature,
      ],
      functionName: "verifyTermsSignature",
    });
  });
});
