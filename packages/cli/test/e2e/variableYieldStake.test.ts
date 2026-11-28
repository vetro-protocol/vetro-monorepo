import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/core";
import {
  type Address,
  type Hex,
  decodeFunctionData,
  erc4626Abi,
  isAddressEqual,
  numberToHex,
  parseEventLogs,
  parseUnits,
  zeroAddress,
} from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import {
  getBlock,
  getChainId,
  revert,
  setNextBlockTimestamp,
  snapshot,
} from "viem/actions";
import { balanceOf } from "viem-erc20/actions";
import { previewDeposit, totalAssets } from "viem-erc4626/actions";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import {
  type TransactionRequest,
  createClients,
  fundTestAccount,
  runCli,
  runCliRaw,
  sendTransactionRequest,
  swapAmount,
  usdc,
  vetBtc,
  vusd,
  withSnapshot,
} from "./helpers.ts";

const receiver = privateKeyToAddress(generatePrivateKey());

describe("variable-yield stake", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient, testClient } = createClients(rpcUrl);

  let snapshotId: Hex;

  const stakeOnFork = (extra: string[] = []) => [
    "variable-yield",
    "stake",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  const stakeArgs = ({
    amount = swapAmount,
    token = vusd.symbol,
  }: {
    amount?: string;
    token?: string;
  } = {}) =>
    stakeOnFork(["--token", token, "--amount", amount, "--receiver", receiver]);

  const decodeDeposit = function (request: TransactionRequest) {
    const { args, functionName } = decodeFunctionData({
      abi: erc4626Abi,
      data: request.data,
    });
    expect(functionName).toBe("deposit");
    const [assets, to] = args as [bigint, Address];
    return { assets, to };
  };

  beforeAll(async function () {
    snapshotId = await snapshot(testClient);
    await fundTestAccount({ amount: "1000", rpcUrl, token: vusd });
  });

  afterAll(() => revert(testClient, { id: snapshotId }));

  it("targets the vault on the chain the RPC is on, with no native value", async function () {
    const request = await runCli<TransactionRequest>(stakeArgs());
    expect(request.chainId).toBe(numberToHex(await getChainId(publicClient)));
    expect(isAddressEqual(request.to, sVusdAddress)).toBe(true);
    expect(request.value).toBe("0x0");
  });

  it("encodes deposit(assets, receiver) in the pegged token's decimals", async function () {
    const request = await runCli<TransactionRequest>(stakeArgs());
    const { assets, to } = decodeDeposit(request);
    expect(assets).toBe(parseUnits(swapAmount, vusd.decimals));
    expect(isAddressEqual(to, receiver)).toBe(true);
  });

  it("encodes the same request by address as by symbol", async function () {
    const bySymbol = await runCli<TransactionRequest>(stakeArgs());
    const byAddress = await runCli<TransactionRequest>(
      stakeArgs({ token: vusd.address }),
    );
    expect(byAddress).toEqual(bySymbol);
  });

  it("targets the vault of the given token", async function () {
    const request = await runCli<TransactionRequest>(
      stakeArgs({ amount: "0.25", token: vetBtc.symbol }),
    );
    expect(isAddressEqual(request.to, sVetBtcAddress)).toBe(true);
    expect(decodeDeposit(request).assets).toBe(
      parseUnits("0.25", vetBtc.decimals),
    );
  });

  it("mints the share token to the receiver once the calldata is broadcast", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const assets = parseUnits(swapAmount, vusd.decimals);
        const approveReceipt = await sendTransactionRequest({
          request: await runCli<TransactionRequest>([
            "variable-yield",
            "approve",
            "--token",
            vusd.symbol,
            "--amount",
            swapAmount,
            "--rpc-url",
            rpcUrl,
          ]),
          rpcUrl,
        });
        expect(approveReceipt.status).toBe("success");

        const [sharesBefore, peggedBefore, totalAssetsBefore, expected] =
          await Promise.all([
            balanceOf(publicClient, {
              account: receiver,
              address: sVusdAddress,
            }),
            balanceOf(publicClient, {
              account: TEST_ADDRESS,
              address: vusd.address,
            }),
            totalAssets(publicClient, { address: sVusdAddress }),
            previewDeposit(publicClient, { address: sVusdAddress, assets }),
          ]);
        expect(expected).toBeGreaterThan(0n);

        const request = await runCli<TransactionRequest>(stakeArgs());
        const latest = await getBlock(publicClient);
        await setNextBlockTimestamp(testClient, {
          timestamp: latest.timestamp,
        });
        const receipt = await sendTransactionRequest({ request, rpcUrl });
        expect(receipt.status).toBe("success");

        const [{ args: event }] = parseEventLogs({
          abi: erc4626Abi,
          eventName: "Deposit",
          logs: receipt.logs,
        });
        expect(isAddressEqual(event.sender, TEST_ADDRESS)).toBe(true);
        expect(isAddressEqual(event.receiver, receiver)).toBe(true);
        expect(event.assets).toBe(assets);
        expect(event.shares).toBe(expected);

        const [sharesAfter, peggedAfter, totalAssetsAfter] = await Promise.all([
          balanceOf(publicClient, { account: receiver, address: sVusdAddress }),
          balanceOf(publicClient, {
            account: TEST_ADDRESS,
            address: vusd.address,
          }),
          totalAssets(publicClient, { address: sVusdAddress }),
        ]);
        expect(sharesAfter - sharesBefore).toBe(expected);
        expect(peggedBefore - peggedAfter).toBe(assets);
        expect(totalAssetsAfter - totalAssetsBefore).toBe(assets);
      },
    });
  });

  it("rejects an amount that mints zero", async function () {
    const { exitCode, stderr } = await runCliRaw(
      stakeArgs({ amount: "0.000000000000000001" }),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Amount is too small to stake "${vusd.symbol}": it mints 0`,
    );
  });

  it.for([usdc.symbol, sVusdAddress])(
    "rejects a token that is not pegged: %s",
    async function (token) {
      const { exitCode, stderr } = await runCliRaw(stakeArgs({ token }));
      expect(exitCode).toBe(1);
      expect(JSON.parse(stderr).error).toBe(`Not a pegged token: "${token}"`);
    },
  );

  it("rejects an amount with more decimals than the token supports", async function () {
    const { exitCode, stderr } = await runCliRaw(
      stakeArgs({ amount: "0.0000000000000000001" }),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Amount has more decimals than "${vusd.symbol}" supports: ${vusd.decimals}`,
    );
  });

  it.for(["0", "abc", "-1"])(
    "rejects --amount %s as a usage error",
    async function (amount) {
      const { exitCode, stderr } = await runCliRaw(stakeArgs({ amount }));
      expect(exitCode).toBe(1);
      expect(stderr).toContain("option '--amount");
    },
  );

  it.for([
    ["notanaddress", 'Invalid address: "notanaddress"'],
    [zeroAddress, `Receiver cannot be the zero address: "${zeroAddress}"`],
  ])("rejects --receiver %s", async function ([value, message]) {
    const { exitCode, stderr } = await runCliRaw(
      stakeOnFork([
        "--token",
        vusd.symbol,
        "--amount",
        swapAmount,
        "--receiver",
        value,
      ]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain(message);
  });

  it.for([
    [
      ["--amount", swapAmount, "--receiver", receiver],
      "required option '--token <token>'",
    ],
    [
      ["--token", vusd.symbol, "--receiver", receiver],
      "required option '--amount <n>'",
    ],
    [
      ["--token", vusd.symbol, "--amount", swapAmount],
      "required option '--receiver <addr>'",
    ],
  ] as const)(
    "rejects a missing option: %s",
    async function ([extra, message]) {
      const { exitCode, stderr } = await runCliRaw(stakeOnFork([...extra]));
      expect(exitCode).toBe(1);
      expect(stderr).toContain(message);
    },
  );
});
