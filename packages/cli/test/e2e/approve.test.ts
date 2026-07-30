import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { isAddressEqual } from "viem";
import { describe, expect, inject, it } from "vitest";

import {
  type TransactionRequest,
  swapAmount,
  approveArgs,
  fundTestAccount,
  runCli,
  runCliRaw,
  sendTransactionRequest,
  usdc,
  vusd,
} from "./helpers.js";

const readAllowance = ({ rpcUrl, token }: { rpcUrl: string; token: string }) =>
  runCli({
    args: ["swap", "allowance", "--token", token, "--account", TEST_ADDRESS],
    rpcUrl,
  });

describe("swap approve", function () {
  const rpcUrl = inject("anvilUrl");

  it("grants the gateway a USDC allowance once the approve calldata is broadcast", async function () {
    await fundTestAccount({ amount: "1000", rpcUrl });
    const request = await runCli<TransactionRequest>({
      args: approveArgs(usdc.symbol),
      rpcUrl,
    });
    expect(isAddressEqual(request.to, usdc.address)).toBe(true);

    const receipt = await sendTransactionRequest({ request, rpcUrl });
    expect(receipt.status).toBe("success");

    expect(await readAllowance({ rpcUrl, token: usdc.symbol })).toBe(
      swapAmount,
    );
  });

  it("grants the gateway an allowance on the pegged token", async function () {
    await fundTestAccount({ amount: "1000", rpcUrl });
    const request = await runCli<TransactionRequest>({
      args: approveArgs(vusd.symbol),
      rpcUrl,
    });
    expect(isAddressEqual(request.to, vusd.address)).toBe(true);

    const receipt = await sendTransactionRequest({ request, rpcUrl });
    expect(receipt.status).toBe("success");

    expect(await readAllowance({ rpcUrl, token: vusd.symbol })).toBe(
      swapAmount,
    );
  });

  it("resolves a token given a non-checksummed address", async function () {
    const request = await runCli<TransactionRequest>({
      args: approveArgs(usdc.address.toLowerCase()),
      rpcUrl,
    });
    expect(isAddressEqual(request.to, usdc.address)).toBe(true);
  });

  it("rejects a token the protocol does not know", async function () {
    const { exitCode, stderr } = await runCliRaw({
      args: approveArgs("USDX"),
      rpcUrl,
    });
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      'Not a whitelisted or pegged token: "USDX"',
    );
  });
});
