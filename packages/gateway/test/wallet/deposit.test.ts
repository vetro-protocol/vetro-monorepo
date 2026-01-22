import { zeroAddress, WalletClient, Address } from "viem";
import { writeContract } from "viem/actions";
import { hemiSepolia } from "viem/chains";
import { describe, it, expect, vi } from "vitest";

import { deposit } from "../../src/actions/wallet/deposit";

vi.mock("viem/actions", () => ({
  writeContract: vi.fn(),
}));

const client: WalletClient = {
  // @ts-expect-error - We only create an empty client for testing purposes
  account: "0x1111111111111111111111111111111111111111" as Address,
  chain: hemiSepolia,
};

const validParameters = {
  address: "0x1234567890123456789012345678901234567890" as Address,
  amountIn: BigInt(1000),
  minPeggedTokenOut: BigInt(900),
  receiver: "0x2222222222222222222222222222222222222222" as Address,
  tokenIn: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
};

describe("deposit", function () {
  it("should throw an error if client is not defined", async function () {
    await expect(
      // @ts-expect-error - Testing invalid input
      deposit(undefined, validParameters),
    ).rejects.toThrow("Client is not defined");
  });

  it("should throw an error if client.account is not defined", async function () {
    // @ts-expect-error - Testing invalid input
    const clientWithoutAccount: WalletClient = { chain: hemiSepolia };

    await expect(
      deposit(clientWithoutAccount, validParameters),
    ).rejects.toThrow("Client must have an account");
  });

  it("should throw an error if client.chain is not defined", async function () {
    // @ts-expect-error - Testing invalid input
    const clientWithoutChain: WalletClient = { account: client.account };

    await expect(deposit(clientWithoutChain, validParameters)).rejects.toThrow(
      "Client must have a chain",
    );
  });

  it("should throw an error if the gateway address is not valid", async function () {
    const parameters = {
      ...validParameters,
      address: "invalid_address",
    };

    // @ts-expect-error - Testing invalid input
    await expect(deposit(client, parameters)).rejects.toThrow(
      "Invalid gateway address",
    );
  });

  it("should throw an error if the gateway address is not provided", async function () {
    const parameters = {
      amountIn: validParameters.amountIn,
      minPeggedTokenOut: validParameters.minPeggedTokenOut,
      receiver: validParameters.receiver,
      tokenIn: validParameters.tokenIn,
    };

    // @ts-expect-error - testing invalid input
    await expect(deposit(client, parameters)).rejects.toThrow(
      "Invalid gateway address",
    );
  });

  it("should throw an error if the gateway address is zero address", async function () {
    const parameters = {
      ...validParameters,
      address: zeroAddress,
    };

    await expect(deposit(client, parameters)).rejects.toThrow(
      "Gateway address cannot be zero address",
    );
  });

  it("should throw an error if the token address is not valid", async function () {
    const parameters = {
      ...validParameters,
      tokenIn: "invalid_token",
    };

    // @ts-expect-error - testing invalid input
    await expect(deposit(client, parameters)).rejects.toThrow(
      "Invalid token address",
    );
  });

  it("should throw an error if the token address is not provided", async function () {
    const parameters = {
      address: validParameters.address,
      amountIn: validParameters.amountIn,
      minPeggedTokenOut: validParameters.minPeggedTokenOut,
      receiver: validParameters.receiver,
    };

    // @ts-expect-error - testing invalid input
    await expect(deposit(client, parameters)).rejects.toThrow(
      "Invalid token address",
    );
  });

  it("should throw an error if the token address is zero address", async function () {
    const parameters = {
      ...validParameters,
      tokenIn: zeroAddress,
    };

    await expect(deposit(client, parameters)).rejects.toThrow(
      "Token address cannot be zero address",
    );
  });

  it("should throw an error if the receiver address is not valid", async function () {
    const parameters = {
      ...validParameters,
      receiver: "invalid_receiver",
    };

    // @ts-expect-error - testing invalid input
    await expect(deposit(client, parameters)).rejects.toThrow(
      "Invalid receiver address",
    );
  });

  it("should throw an error if the receiver address is not provided", async function () {
    const parameters = {
      address: validParameters.address,
      amountIn: validParameters.amountIn,
      minPeggedTokenOut: validParameters.minPeggedTokenOut,
      tokenIn: validParameters.tokenIn,
    };

    // @ts-expect-error - testing invalid input
    await expect(deposit(client, parameters)).rejects.toThrow(
      "Invalid receiver address",
    );
  });

  it("should throw an error if the receiver address is zero address", async function () {
    const parameters = {
      ...validParameters,
      receiver: zeroAddress,
    };

    await expect(deposit(client, parameters)).rejects.toThrow(
      "Receiver address cannot be zero address",
    );
  });

  it("should throw an error if amountIn is not a bigint", async function () {
    const parameters = { ...validParameters, amountIn: 1000 };

    // @ts-expect-error - testing invalid input
    await expect(deposit(client, parameters)).rejects.toThrow(
      "Amount must be a bigint",
    );
  });

  it("should throw an error if amountIn is zero", async function () {
    const parameters = { ...validParameters, amountIn: BigInt(0) };

    await expect(deposit(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should throw an error if amountIn is negative", async function () {
    const parameters = { ...validParameters, amountIn: BigInt(-1) };

    await expect(deposit(client, parameters)).rejects.toThrow(
      "Amount must be greater than 0",
    );
  });

  it("should throw an error if minPeggedTokenOut is not a bigint", async function () {
    const parameters = { ...validParameters, minPeggedTokenOut: 900 };

    // @ts-expect-error - testing invalid input
    await expect(deposit(client, parameters)).rejects.toThrow(
      "Minimum output must be a bigint",
    );
  });

  it("should throw an error if minPeggedTokenOut is negative", async function () {
    const parameters = { ...validParameters, minPeggedTokenOut: BigInt(-1) };

    await expect(deposit(client, parameters)).rejects.toThrow(
      "Minimum output cannot be negative",
    );
  });

  it("should call writeContract if all parameters are valid", async function () {
    vi.mocked(writeContract);

    await deposit(client, validParameters);

    expect(writeContract).toHaveBeenCalledWith(client, {
      abi: expect.anything(),
      account: client.account,
      address: validParameters.address,
      args: [
        validParameters.tokenIn,
        validParameters.amountIn,
        validParameters.minPeggedTokenOut,
        validParameters.receiver,
      ],
      chain: client.chain,
      functionName: "deposit",
    });
  });
});
