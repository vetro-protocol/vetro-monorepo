import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { previewDeposit } from "@vetro-protocol/gateway/actions";
import {
  type Address,
  decodeFunctionData,
  isAddress,
  isAddressEqual,
  isHex,
  parseUnits,
} from "viem";
import { describe, expect, inject, it } from "vitest";

import {
  type TransactionRequest,
  swapAmount,
  createClients,
  gatewayAbi,
  mintArgs,
  runCli,
  runCliRaw,
  setMaxMint,
  slippage,
  usdc,
  vusd,
} from "./helpers.js";

describe("swap mint", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient } = createClients(rpcUrl);

  it("targets mainnet with no native value", async function () {
    const request = await runCli<TransactionRequest>({
      args: mintArgs(),
      rpcUrl,
    });
    expect(request.chainId).toBe("0x1");
    expect(isHex(request.data)).toBe(true);
    expect(isAddress(request.to)).toBe(true);
    expect(request.value).toBe("0x0");
  });

  it("deposits into the gateway that mints VUSD", async function () {
    const request = await runCli<TransactionRequest>({
      args: mintArgs(),
      rpcUrl,
    });
    const peggedToken = await runCli<Address>({
      args: ["swap", "pegged-token", "--gateway", request.to],
      rpcUrl,
    });
    expect(isAddressEqual(peggedToken, vusd.address)).toBe(true);
  });

  it("encodes the deposit arguments as given", async function () {
    const request = await runCli<TransactionRequest>({
      args: mintArgs(["--slippage", slippage]),
      rpcUrl,
    });
    const { args } = decodeFunctionData({
      abi: gatewayAbi,
      data: request.data,
    });
    const [tokenIn, amountIn, minPeggedTokenOut, receiver] = args;

    expect(isAddressEqual(tokenIn, usdc.address)).toBe(true);
    expect(amountIn).toBe(parseUnits(swapAmount, usdc.decimals));
    expect(isAddressEqual(receiver, TEST_ADDRESS)).toBe(true);
    // The gateway previews 100 USDC 1:1 into VUSD, so 0.5% off it is exactly 99.5.
    expect(minPeggedTokenOut).toBe(parseUnits("99.5", vusd.decimals));
  });

  it("requires the full preview when --slippage is omitted", async function () {
    const request = await runCli<TransactionRequest>({
      args: mintArgs(),
      rpcUrl,
    });
    const { args } = decodeFunctionData({
      abi: gatewayAbi,
      data: request.data,
    });
    // Read independently of the CLI, to check its slippage math against the source.
    const preview = await previewDeposit(publicClient, {
      address: request.to,
      amountIn: parseUnits(swapAmount, usdc.decimals),
      tokenIn: usdc.address,
    });
    expect(args[2]).toBe(preview);
  });

  it("encodes the deposit when --to is the gateway's pegged token", async function () {
    const request = await runCli<TransactionRequest>({
      args: mintArgs(["--to", vusd.symbol]),
      rpcUrl,
    });
    const { args } = decodeFunctionData({
      abi: gatewayAbi,
      data: request.data,
    });
    const [tokenIn, amountIn, , receiver] = args;

    expect(isAddressEqual(tokenIn, usdc.address)).toBe(true);
    expect(amountIn).toBe(parseUnits(swapAmount, usdc.decimals));
    expect(isAddressEqual(receiver, TEST_ADDRESS)).toBe(true);
  });

  it("rejects a --to that is not the gateway's pegged token", async function () {
    const { exitCode, stderr } = await runCliRaw({
      args: mintArgs(["--to", "vetBTC"]),
      rpcUrl,
    });
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toContain("is not the pegged token");
  });

  it("rejects minting from a pegged token", async function () {
    const { exitCode, stderr } = await runCliRaw({
      args: [
        "swap",
        "mint",
        "--from",
        vusd.symbol,
        "--amount",
        swapAmount,
        "--receiver",
        TEST_ADDRESS,
      ],
      rpcUrl,
    });
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a whitelisted token: "${vusd.symbol}"`,
    );
  });

  it("rejects an amount that would mint past the gateway's remaining capacity", async function () {
    const { to: gateway } = await runCli<TransactionRequest>({
      args: mintArgs(),
      rpcUrl,
    });
    const remainingCapacity = parseUnits("0.5", vusd.decimals);
    const { maxMintAfter, maxMintBefore } = await setMaxMint({
      gateway,
      maxMint: remainingCapacity,
      rpcUrl,
    });
    expect(maxMintAfter).toBe(remainingCapacity);

    try {
      // Below the max mint
      const request = await runCli<TransactionRequest>({
        args: mintArgs(["--amount", "0.1"]),
        rpcUrl,
      });

      // above the max mint
      const { exitCode, stderr } = await runCliRaw({
        args: mintArgs(),
        rpcUrl,
      });
      expect(exitCode).toBe(1);
      expect(JSON.parse(stderr).error).toContain(
        "Amount exceeds the mint limit",
      );

      expect(isHex(request.data)).toBe(true);
    } finally {
      await setMaxMint({ gateway, maxMint: maxMintBefore, rpcUrl });
    }
  });

  it.for([
    ["--amount", "0"],
    ["--amount", "abc"],
    ["--amount", "-1"],
    ["--slippage", "101"],
    ["--slippage", "0.25"],
    ["--receiver", "notanaddress"],
  ])("rejects %s %s as a usage error", async function ([flag, value]) {
    // Later occurrences win in commander, so appending overrides the default.
    const { exitCode, stderr } = await runCliRaw({
      args: mintArgs([flag, value]),
      rpcUrl,
    });
    expect(exitCode).toBe(1);
    expect(stderr).toContain(`option '${flag}`);
  });
});
