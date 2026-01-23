import { zeroAddress, WalletClient, Address } from "viem";
import { writeContract } from "viem/actions";
import { hemiSepolia } from "viem/chains";
import { describe, it, expect, vi } from "vitest";

import { redeem } from "../../src/actions/wallet/redeem";

vi.mock("viem/actions", () => ({
  writeContract: vi.fn(),
}));

const client: WalletClient = {
  // @ts-expect-error - We only create an empty client for testing purposes
  account: zeroAddress,
  chain: hemiSepolia,
};

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  minAmountOut: BigInt(900),
  peggedTokenIn: BigInt(1000),
  receiver: "0x2222222222222222222222222222222222222222" as Address,
  tokenOut: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

describe("redeem", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      redeem(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if client.account is not defined", async function () {
    // @ts-expect-error - testing invalid input
    const clientWithoutAccount: WalletClient = { chain: client.chain };

    await expect(redeem(clientWithoutAccount, validParameters)).rejects.toThrow(
      "Client must have an account",
    );
  });

  it("should throw an error if client.chain is not defined", async function () {
    // @ts-expect-error - testing invalid input
    const clientWithoutChain: WalletClient = { account: client.account };

    await expect(redeem(clientWithoutChain, validParameters)).rejects.toThrow(
      "Client must have a chain",
    );
  });

  it("should throw an error if parameters are not provided", async function () {
    // @ts-expect-error - Testing invalid input
    await expect(redeem(client, undefined)).rejects.toThrow(
      "Parameters are required",
    );
  });

  it("should throw an error if the gateway address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };

    // @ts-expect-error - testing invalid input
    await expect(redeem(client, parameters)).rejects.toThrow(
      "Invalid gateway address",
    );
  });

  it("should throw an error if the gateway address is not provided", async function () {
    const parameters = {
      minAmountOut: validParameters.minAmountOut,
      peggedTokenIn: validParameters.peggedTokenIn,
      receiver: validParameters.receiver,
      tokenOut: validParameters.tokenOut,
    };

    // @ts-expect-error - testing invalid input
    await expect(redeem(client, parameters)).rejects.toThrow(
      "Invalid gateway address",
    );
  });

  it("should throw an error if the gateway address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(redeem(client, parameters)).rejects.toThrow(
      "Gateway address cannot be zero address",
    );
  });

  it("should throw an error if the token address is not valid", async function () {
    const parameters = {
      ...validParameters,
      tokenOut: "invalid_token",
    };

    // @ts-expect-error - testing invalid input
    await expect(redeem(client, parameters)).rejects.toThrow(
      "Invalid token address",
    );
  });

  it("should throw an error if the token address is not provided", async function () {
    const parameters = {
      address: validParameters.address,
      minAmountOut: validParameters.minAmountOut,
      peggedTokenIn: validParameters.peggedTokenIn,
      receiver: validParameters.receiver,
    };

    // @ts-expect-error - testing invalid input
    await expect(redeem(client, parameters)).rejects.toThrow(
      "Invalid token address",
    );
  });

  it("should throw an error if the token address is zero address", async function () {
    const parameters = {
      ...validParameters,
      tokenOut: zeroAddress,
    };

    await expect(redeem(client, parameters)).rejects.toThrow(
      "Token address cannot be zero address",
    );
  });

  it("should throw an error if the receiver address is not valid", async function () {
    const parameters = {
      ...validParameters,
      receiver: "invalid_receiver",
    };

    // @ts-expect-error - testing invalid input
    await expect(redeem(client, parameters)).rejects.toThrow(
      "Invalid receiver address",
    );
  });

  it("should throw an error if the receiver address is not provided", async function () {
    const parameters = {
      address: validParameters.address,
      minAmountOut: validParameters.minAmountOut,
      peggedTokenIn: validParameters.peggedTokenIn,
      tokenOut: validParameters.tokenOut,
    };

    // @ts-expect-error - testing invalid input
    await expect(redeem(client, parameters)).rejects.toThrow(
      "Invalid receiver address",
    );
  });

  it("should throw an error if the receiver address is zero address", async function () {
    const parameters = {
      ...validParameters,
      receiver: zeroAddress,
    };

    await expect(redeem(client, parameters)).rejects.toThrow(
      "Receiver address cannot be zero address",
    );
  });

  it("should throw an error if peggedTokenIn is not a bigint", async function () {
    const parameters = { ...validParameters, peggedTokenIn: "1000" };

    // @ts-expect-error - testing invalid input
    await expect(redeem(client, parameters)).rejects.toThrow(
      "Amount must be a bigint",
    );
  });

  it("should throw an error if peggedTokenIn is zero", async function () {
    const parameters = { ...validParameters, peggedTokenIn: BigInt(0) };

    await expect(redeem(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should throw an error if peggedTokenIn is negative", async function () {
    const parameters = { ...validParameters, peggedTokenIn: BigInt(-1) };

    await expect(redeem(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should throw an error if minAmountOut is not a bigint", async function () {
    const parameters = { ...validParameters, minAmountOut: 900 };

    // @ts-expect-error - testing invalid input
    await expect(redeem(client, parameters)).rejects.toThrow(
      "Minimum output must be a bigint",
    );
  });

  it("should throw an error if minAmountOut is negative", async function () {
    const parameters = { ...validParameters, minAmountOut: BigInt(-1) };

    await expect(redeem(client, parameters)).rejects.toThrow(
      "Minimum output cannot be negative",
    );
  });

  it("should call writeContract if all parameters are valid", async function () {
    vi.mocked(writeContract);

    await redeem(client, validParameters);

    expect(writeContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      account: client.account,
      address: validParameters.address,
      args: [
        validParameters.tokenOut,
        validParameters.peggedTokenIn,
        validParameters.minAmountOut,
        validParameters.receiver,
      ],
      chain: client.chain,
      functionName: "redeem",
    });
  });
});
