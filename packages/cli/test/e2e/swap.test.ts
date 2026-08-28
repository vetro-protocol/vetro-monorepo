import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import {
  getRedeemRequest,
  getWithdrawalDelay,
} from "@vetro-protocol/gateway/actions";
import { decodeFunctionData, parseUnits } from "viem";
import { getBlock } from "viem/actions";
import { balanceOf } from "viem-erc20/actions";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import {
  type TransactionRequest,
  approveArgs,
  createClients,
  depositAbi,
  fundTestAccount,
  mintArgs,
  runCli,
  sendToQueueArgs,
  sendTransactionRequest,
  setRedeemQueueEnabled,
  slippage,
  usdc,
  vusd,
} from "./helpers.ts";

const rpcUrl = inject("anvilUrl");
const { publicClient } = createClients(rpcUrl);

const onFork = (args: string[]) => [...args, "--rpc-url", rpcUrl];

const broadcast = async function (args: string[]) {
  const receipt = await sendTransactionRequest({
    request: await runCli<TransactionRequest>(onFork(args)),
    rpcUrl,
  });
  expect(receipt.status).toBe("success");
  return receipt;
};

// Spans approve and mint, so it lives here rather than in either command's file.
describe("swap in (USDC → VUSD)", function () {
  it("mints at least minPeggedTokenOut once the mint calldata is broadcast", async function () {
    const mintRequest = await runCli<TransactionRequest>(
      onFork(mintArgs(["--slippage", slippage])),
    );
    await fundTestAccount({ amount: "1000", rpcUrl });
    // Approving sets the allowance, so this is safe however often it runs.
    await broadcast(approveArgs(usdc.symbol));

    const { args } = decodeFunctionData({
      abi: depositAbi,
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

describe("swap out step 1 (VUSD → queue)", function () {
  const [gateway] = gatewayAddresses;

  const queuedAmount = "50";

  let restoreQueue: (() => Promise<void>) | undefined;

  beforeAll(async function () {
    restoreQueue = await setRedeemQueueEnabled({
      enabled: true,
      gateway,
      rpcUrl,
    });
  });

  afterAll(() => restoreQueue?.());

  it("locks the pegged token once the send-to-queue calldata is broadcast", async function () {
    await fundTestAccount({ amount: "1000", rpcUrl });
    await broadcast(approveArgs(usdc.symbol));
    await broadcast(mintArgs());
    await broadcast(approveArgs(vusd.symbol));

    const [amountLockedBefore] = await getRedeemRequest(publicClient, {
      address: gateway,
      user: TEST_ADDRESS,
    });

    const receipt = await broadcast(
      sendToQueueArgs(["--amount", queuedAmount]),
    );

    const [[amountLockedAfter, claimableAt], block, delay] = await Promise.all([
      getRedeemRequest(publicClient, { address: gateway, user: TEST_ADDRESS }),
      getBlock(publicClient, { blockNumber: receipt.blockNumber }),
      getWithdrawalDelay(publicClient, { address: gateway }),
    ]);
    expect(amountLockedAfter - amountLockedBefore).toBe(
      parseUnits(queuedAmount, vusd.decimals),
    );
    expect(claimableAt).toBe(block.timestamp + delay);
  });
});
