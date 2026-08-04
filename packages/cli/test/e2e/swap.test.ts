import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { decodeFunctionData } from "viem";
import { balanceOf } from "viem-erc20/actions";
import { describe, expect, inject, it } from "vitest";

import {
  type TransactionRequest,
  approveArgs,
  createClients,
  fundTestAccount,
  gatewayAbi,
  mintArgs,
  runCli,
  sendTransactionRequest,
  slippage,
  usdc,
  vusd,
} from "./helpers.js";

// Spans approve and mint, so it lives here rather than in either command's file.
describe("swap in (USDC → VUSD)", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient } = createClients(rpcUrl);

  const onFork = (args: string[]) => [...args, "--rpc-url", rpcUrl];

  it("mints at least minPeggedTokenOut once the mint calldata is broadcast", async function () {
    const mintRequest = await runCli<TransactionRequest>(
      onFork(mintArgs(["--slippage", slippage])),
    );
    await fundTestAccount({ amount: "1000", rpcUrl });
    // Approving sets the allowance, so this is safe however often it runs.
    await sendTransactionRequest({
      request: await runCli<TransactionRequest>(
        onFork(approveArgs(usdc.symbol)),
      ),
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
});
