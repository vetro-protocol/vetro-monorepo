import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { previewDeposit } from "@vetro-protocol/gateway/actions";
import {
  type Address,
  decodeFunctionData,
  isAddress,
  isAddressEqual,
  isHex,
  parseAbi,
  parseUnits,
} from "viem";
import { balanceOf } from "viem-erc20/actions";
import { describe, expect, inject, it } from "vitest";

import {
  type TransactionRequest,
  createClients,
  fundTestAccount,
  runCli,
  runCliRaw,
  sendTransactionRequest,
  usdc,
  vusd,
} from "./helpers.js";

const gatewayAbi = parseAbi([
  "function deposit(address tokenIn, uint256 amountIn, uint256 minPeggedTokenOut, address receiver)",
]);

const amount = "100";
const slippage = "0.5";

const mintArgs = (extra: string[] = []) => [
  "swap",
  "mint",
  "--from",
  usdc.symbol,
  "--amount",
  amount,
  "--receiver",
  TEST_ADDRESS,
  ...extra,
];

const approveArgs = (token: string) => [
  "swap",
  "approve",
  "--token",
  token,
  "--amount",
  amount,
];

const readAllowance = ({ rpcUrl, token }: { rpcUrl: string; token: string }) =>
  runCli({
    args: ["swap", "allowance", "--token", token, "--account", TEST_ADDRESS],
    rpcUrl,
  });

describe("swap in (USDC → VUSD)", function () {
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
    expect(amountIn).toBe(parseUnits(amount, usdc.decimals));
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
      amountIn: parseUnits(amount, usdc.decimals),
      tokenIn: usdc.address,
    });
    expect(args[2]).toBe(preview);
  });

  it("grants the gateway a USDC allowance once the approve calldata is broadcast", async function () {
    await fundTestAccount({ amount: "1000", rpcUrl });
    const request = await runCli<TransactionRequest>({
      args: approveArgs(usdc.symbol),
      rpcUrl,
    });
    expect(isAddressEqual(request.to, usdc.address)).toBe(true);

    const receipt = await sendTransactionRequest({ request, rpcUrl });
    expect(receipt.status).toBe("success");

    expect(await readAllowance({ rpcUrl, token: usdc.symbol })).toBe(amount);
  });

  it("mints at least minPeggedTokenOut once the mint calldata is broadcast", async function () {
    const mintRequest = await runCli<TransactionRequest>({
      args: mintArgs(["--slippage", slippage]),
      rpcUrl,
    });
    await fundTestAccount({ amount: "1000", rpcUrl });
    // Approving sets the allowance, so this is safe however often it runs.
    await sendTransactionRequest({
      request: await runCli<TransactionRequest>({
        args: approveArgs(usdc.symbol),
        rpcUrl,
      }),
      rpcUrl,
    });

    const { args } = decodeFunctionData({
      abi: gatewayAbi,
      data: mintRequest.data,
    });
    const balanceBefore = await balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vusd.address,
    });

    const receipt = await sendTransactionRequest({
      request: mintRequest,
      rpcUrl,
    });
    expect(receipt.status).toBe("success");

    const balanceAfter = await balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vusd.address,
    });
    expect(balanceAfter - balanceBefore).toBeGreaterThanOrEqual(args[2]);
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

    expect(await readAllowance({ rpcUrl, token: vusd.symbol })).toBe(amount);
  });

  it("rejects a --to that is not the gateway's pegged token", async function () {
    const { exitCode, stderr } = await runCliRaw({
      args: mintArgs(["--to", "vetBTC"]),
      rpcUrl,
    });
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toContain("is not the pegged token");
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

  it("rejects minting from a pegged token", async function () {
    const { exitCode, stderr } = await runCliRaw({
      args: [
        "swap",
        "mint",
        "--from",
        vusd.symbol,
        "--amount",
        amount,
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
