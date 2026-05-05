import { type Address, type Client, padHex, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { hemi } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { quoteSend } from "../../src/actions/public/quoteSend";

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const validParameters = {
  amount: BigInt(1000),
  destinationChainId: hemi.id,
  oftAddress: "0x1234567890123456789012345678901234567890" as Address,
  recipient: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

// @ts-expect-error - We only create an empty client for testing purposes
const client: Client = {};

describe("quoteSend", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      quoteSend(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(quoteSend(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if oftAddress is invalid", async function () {
    const parameters = { ...validParameters, oftAddress: "not_an_address" };
    // @ts-expect-error - Testing invalid input
    await expect(quoteSend(client, parameters)).rejects.toThrow(
      "OFT address is invalid",
    );
  });

  it("should throw an error if oftAddress is zero address", async function () {
    const parameters = { ...validParameters, oftAddress: zeroAddress };
    await expect(quoteSend(client, parameters)).rejects.toThrow(
      "OFT address is invalid",
    );
  });

  it("should throw an error if recipient is invalid", async function () {
    const parameters = { ...validParameters, recipient: "not_an_address" };
    // @ts-expect-error - Testing invalid input
    await expect(quoteSend(client, parameters)).rejects.toThrow(
      "Recipient address is invalid",
    );
  });

  it("should throw an error if recipient is zero address", async function () {
    const parameters = { ...validParameters, recipient: zeroAddress };
    await expect(quoteSend(client, parameters)).rejects.toThrow(
      "Recipient address is invalid",
    );
  });

  it("should throw an error if amount is not a bigint", async function () {
    const parameters = { ...validParameters, amount: 1000 };
    // @ts-expect-error - Testing invalid input
    await expect(quoteSend(client, parameters)).rejects.toThrow(
      "Amount must be a bigint",
    );
  });

  it("should throw an error if amount is zero", async function () {
    const parameters = { ...validParameters, amount: 0n };
    await expect(quoteSend(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should throw an error if minAmount is not a bigint", async function () {
    const parameters = { ...validParameters, minAmount: 1000 };
    // @ts-expect-error - Testing invalid input
    await expect(quoteSend(client, parameters)).rejects.toThrow(
      "Min amount must be a bigint",
    );
  });

  it("should throw an error if minAmount is zero", async function () {
    const parameters = { ...validParameters, minAmount: 0n };
    await expect(quoteSend(client, parameters)).rejects.toThrow(
      "Min amount must be greater than 0",
    );
  });

  it("should throw an error if minAmount is greater than amount", async function () {
    const parameters = {
      ...validParameters,
      minAmount: validParameters.amount + 1n,
    };
    await expect(quoteSend(client, parameters)).rejects.toThrow(
      "Min amount must be less than or equal to amount",
    );
  });

  it("should throw an error if destinationChainId has no LayerZero EID", async function () {
    const parameters = { ...validParameters, destinationChainId: 999_999 };
    await expect(quoteSend(client, parameters)).rejects.toThrow(
      "No LayerZero EID registered for chainId 999999",
    );
  });

  it("should call readContract with the correct sendParam and return the fee", async function () {
    const fee = { lzTokenFee: 0n, nativeFee: 1_000_000_000n };
    vi.mocked(readContract).mockResolvedValueOnce(fee);

    const result = await quoteSend(client, validParameters);

    expect(readContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      address: validParameters.oftAddress,
      args: [
        {
          amountLD: validParameters.amount,
          composeMsg: "0x",
          dstEid: 30329,
          extraOptions: "0x",
          minAmountLD: validParameters.amount,
          oftCmd: "0x",
          to: padHex(validParameters.recipient, { size: 32 }),
        },
        false,
      ],
      functionName: "quoteSend",
    });
    expect(result).toEqual(fee);
  });

  it("should propagate explicit minAmount into minAmountLD", async function () {
    const fee = { lzTokenFee: 0n, nativeFee: 1_000_000_000n };
    vi.mocked(readContract).mockResolvedValueOnce(fee);

    const minAmount = validParameters.amount - 10n;
    await quoteSend(client, { ...validParameters, minAmount });

    expect(readContract).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        args: [expect.objectContaining({ minAmountLD: minAmount }), false],
      }),
    );
  });
});
