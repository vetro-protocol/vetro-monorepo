import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/core";
import {
  type Address,
  type Hex,
  decodeFunctionData,
  erc4626Abi,
  formatUnits,
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
import { balanceOf, decimals, symbol } from "viem-erc20/actions";
import { previewWithdraw, totalAssets } from "viem-erc4626/actions";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import {
  type TransactionRequest,
  createClients,
  fastForward,
  fundTestAccount,
  runCli,
  runCliRaw,
  sendTransactionRequest,
  setInstantWithdrawWhitelisted,
  setStakingCooldown,
  stake,
  usdc,
  vetBtc,
  vusd,
  withSnapshot,
} from "./helpers.ts";

const receiver = privateKeyToAddress(generatePrivateKey());

describe("variable-yield instant-withdraw", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient, testClient } = createClients(rpcUrl);
  const vaults = [sVusdAddress, sVetBtcAddress];
  const amount = "10";

  let snapshotId: Hex;

  const instantWithdrawOnFork = (extra: string[] = []) => [
    "variable-yield",
    "instant-withdraw",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  const instantWithdrawArgs = ({
    account = TEST_ADDRESS,
    amount: value = amount,
    receiver: to = receiver,
    shares,
    token = vusd.symbol,
  }: {
    account?: string;
    amount?: string;
    receiver?: string;
    shares?: string;
    token?: string;
  } = {}) =>
    instantWithdrawOnFork([
      "--token",
      token,
      ...(shares === undefined ? ["--amount", value] : ["--shares", shares]),
      "--account",
      account,
      "--receiver",
      to,
    ]);

  const decodeRequest = function (request: TransactionRequest) {
    const { args, functionName } = decodeFunctionData({
      abi: erc4626Abi,
      data: request.data,
    });
    const [value, to, owner] = args as [bigint, Address, Address];
    return { functionName, owner, to, value };
  };

  const readShares = () =>
    balanceOf(publicClient, { account: TEST_ADDRESS, address: sVusdAddress });

  const freezeClock = async function () {
    await fastForward({ rpcUrl, seconds: 60n });
    const latest = await getBlock(publicClient);
    await setNextBlockTimestamp(testClient, { timestamp: latest.timestamp });
  };

  const broadcastWithdraw = async function (args: string[]) {
    const request = await runCli<TransactionRequest>(args);
    const receipt = await sendTransactionRequest({ request, rpcUrl });
    expect(receipt.status).toBe("success");
    const [{ args: event }] = parseEventLogs({
      abi: erc4626Abi,
      eventName: "Withdraw",
      logs: receipt.logs,
    });
    return event;
  };

  const setWhitelisted = (whitelisted: boolean) =>
    setInstantWithdrawWhitelisted({
      account: TEST_ADDRESS,
      rpcUrl,
      vault: sVusdAddress,
      whitelisted,
    });

  beforeAll(async function () {
    snapshotId = await snapshot(testClient);
    for (const vault of vaults) {
      await setStakingCooldown({
        enabled: true,
        rpcUrl,
        vault,
      });
      await setInstantWithdrawWhitelisted({
        account: TEST_ADDRESS,
        rpcUrl,
        vault,
        whitelisted: true,
      });
    }
    await fundTestAccount({ amount: "1000", rpcUrl, token: vusd });
    await fundTestAccount({ amount: "1", rpcUrl, token: vetBtc });
    await stake({
      amount: parseUnits("250", vusd.decimals),
      rpcUrl,
      token: vusd.address,
      vault: sVusdAddress,
    });
    await stake({
      amount: parseUnits("0.25", vetBtc.decimals),
      rpcUrl,
      token: vetBtc.address,
      vault: sVetBtcAddress,
    });
  });

  afterAll(() => revert(testClient, { id: snapshotId }));

  it("targets the vault on the chain the RPC is on, with no native value", async function () {
    const request = await runCli<TransactionRequest>(instantWithdrawArgs());
    expect(request.chainId).toBe(numberToHex(await getChainId(publicClient)));
    expect(isAddressEqual(request.to, sVusdAddress)).toBe(true);
    expect(request.value).toBe("0x0");
  });

  it("encodes withdraw(assets, receiver, owner) in the pegged token's decimals", async function () {
    const request = await runCli<TransactionRequest>(instantWithdrawArgs());
    const { functionName, owner, to, value } = decodeRequest(request);
    expect(functionName).toBe("withdraw");
    expect(value).toBe(parseUnits(amount, vusd.decimals));
    expect(isAddressEqual(to, receiver)).toBe(true);
    expect(isAddressEqual(owner, TEST_ADDRESS)).toBe(true);
  });

  it("encodes redeem(shares, receiver, owner) in the share token's decimals", async function () {
    const shareDecimals = await decimals(publicClient, {
      address: sVusdAddress,
    });
    const request = await runCli<TransactionRequest>(
      instantWithdrawArgs({ shares: amount }),
    );
    const { functionName, owner, to, value } = decodeRequest(request);
    expect(functionName).toBe("redeem");
    expect(value).toBe(parseUnits(amount, shareDecimals));
    expect(isAddressEqual(to, receiver)).toBe(true);
    expect(isAddressEqual(owner, TEST_ADDRESS)).toBe(true);
  });

  it("encodes the same request by pegged or share token, by symbol or address", async function () {
    const shareSymbol = await symbol(publicClient, { address: sVusdAddress });

    const requests: TransactionRequest[] = [];
    for (const token of [
      vusd.symbol,
      vusd.address,
      shareSymbol,
      sVusdAddress,
    ]) {
      requests.push(
        await runCli<TransactionRequest>(instantWithdrawArgs({ token })),
      );
    }

    expect(requests).toEqual(Array(4).fill(requests[0]));
  });

  it("targets the vault of the given token", async function () {
    const request = await runCli<TransactionRequest>(
      instantWithdrawArgs({ amount: "0.01", token: vetBtc.symbol }),
    );
    expect(isAddressEqual(request.to, sVetBtcAddress)).toBe(true);
    const { functionName, value } = decodeRequest(request);
    expect(functionName).toBe("withdraw");
    expect(value).toBe(parseUnits("0.01", vetBtc.decimals));
  });

  it("withdraws for an account that is not whitelisted when the cooldown is disabled", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        await setStakingCooldown({
          enabled: false,
          rpcUrl,
          vault: sVusdAddress,
        });
        await setWhitelisted(false);

        await freezeClock();
        const event = await broadcastWithdraw(instantWithdrawArgs());
        expect(isAddressEqual(event.owner, TEST_ADDRESS)).toBe(true);
        expect(event.assets).toBe(parseUnits(amount, vusd.decimals));
      },
    });
  });

  it("pays the pegged token to the receiver and burns the shares once the calldata is broadcast", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const assets = parseUnits(amount, vusd.decimals);

        await freezeClock();
        const [
          receiverBalanceBefore,
          sharesBefore,
          totalAssetsBefore,
          previewedShares,
        ] = await Promise.all([
          balanceOf(publicClient, { account: receiver, address: vusd.address }),
          balanceOf(publicClient, {
            account: TEST_ADDRESS,
            address: sVusdAddress,
          }),
          totalAssets(publicClient, { address: sVusdAddress }),
          previewWithdraw(publicClient, { address: sVusdAddress, assets }),
        ]);

        const event = await broadcastWithdraw(instantWithdrawArgs());
        expect(isAddressEqual(event.sender, TEST_ADDRESS)).toBe(true);
        expect(isAddressEqual(event.owner, TEST_ADDRESS)).toBe(true);
        expect(isAddressEqual(event.receiver, receiver)).toBe(true);
        expect(event.assets).toBe(assets);
        expect(event.shares).toBe(previewedShares);

        const [receiverBalanceAfter, sharesAfter, totalAssetsAfter] =
          await Promise.all([
            balanceOf(publicClient, {
              account: receiver,
              address: vusd.address,
            }),
            balanceOf(publicClient, {
              account: TEST_ADDRESS,
              address: sVusdAddress,
            }),
            totalAssets(publicClient, { address: sVusdAddress }),
          ]);
        expect(receiverBalanceAfter - receiverBalanceBefore).toBe(assets);
        expect(sharesBefore - sharesAfter).toBe(previewedShares);
        expect(totalAssetsBefore - totalAssetsAfter).toBe(assets);
      },
    });
  });

  it("withdraws the whole position with no dust when given all the shares", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const shareDecimals = await decimals(publicClient, {
          address: sVusdAddress,
        });
        const sharesBefore = await readShares();
        expect(sharesBefore).toBeGreaterThan(0n);
        const receiverBalanceBefore = await balanceOf(publicClient, {
          account: receiver,
          address: vusd.address,
        });

        await freezeClock();
        const event = await broadcastWithdraw(
          instantWithdrawArgs({
            shares: formatUnits(sharesBefore, shareDecimals),
          }),
        );
        expect(event.shares).toBe(sharesBefore);
        expect(await readShares()).toBe(0n);
        const receiverBalanceAfter = await balanceOf(publicClient, {
          account: receiver,
          address: vusd.address,
        });
        expect(receiverBalanceAfter - receiverBalanceBefore).toBe(event.assets);
      },
    });
  });

  it("rejects --amount and --shares together", async function () {
    const { exitCode, stderr } = await runCliRaw(
      instantWithdrawOnFork([
        "--token",
        vusd.symbol,
        "--amount",
        amount,
        "--shares",
        amount,
        "--account",
        TEST_ADDRESS,
        "--receiver",
        receiver,
      ]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain(
      "option '--amount <n>' cannot be used with option '--shares <n>'",
    );
  });

  it("rejects a request with neither --amount nor --shares", async function () {
    const { exitCode, stderr } = await runCliRaw(
      instantWithdrawOnFork([
        "--token",
        vusd.symbol,
        "--account",
        TEST_ADDRESS,
        "--receiver",
        receiver,
      ]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain(
      "one of '--amount <n>' or '--shares <n>' is required",
    );
  });

  it("rejects an account that is not whitelisted when the cooldown is enabled", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        await setWhitelisted(false);

        const { exitCode, stderr } = await runCliRaw(instantWithdrawArgs());
        expect(exitCode).toBe(1);
        expect(JSON.parse(stderr).error).toBe(
          `"${TEST_ADDRESS}" cannot withdraw with no cooldown on the vault of "${vusd.symbol}"; use unstake instead`,
        );
      },
    });
  });

  it("rejects a token that is not pegged or share", async function () {
    const { exitCode, stderr } = await runCliRaw(
      instantWithdrawArgs({ token: usdc.symbol }),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a pegged or share token: "${usdc.symbol}"`,
    );
  });

  it("rejects an amount with more decimals than the pegged token supports", async function () {
    const { exitCode, stderr } = await runCliRaw(
      instantWithdrawArgs({ amount: "0.0000000000000000001" }),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Amount has more decimals than "${vusd.symbol}" supports: ${vusd.decimals}`,
    );
  });

  it("rejects shares with more decimals than the share token supports", async function () {
    const [shareDecimals, shareSymbol] = await Promise.all([
      decimals(publicClient, { address: sVusdAddress }),
      symbol(publicClient, { address: sVusdAddress }),
    ]);
    const { exitCode, stderr } = await runCliRaw(
      instantWithdrawArgs({ shares: `0.${"0".repeat(shareDecimals)}1` }),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Amount has more decimals than "${shareSymbol}" supports: ${shareDecimals}`,
    );
  });

  it.for([
    ["--amount", "0"],
    ["--amount", "abc"],
    ["--amount", "-1"],
    ["--shares", "0"],
    ["--shares", "abc"],
    ["--shares", "-1"],
  ])("rejects %s %s as a usage error", async function ([flag, value]) {
    const { exitCode, stderr } = await runCliRaw(
      instantWithdrawArgs(
        flag === "--shares" ? { shares: value } : { amount: value },
      ),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain(`option '${flag}`);
  });

  it("rejects an invalid --account", async function () {
    const { exitCode, stderr } = await runCliRaw(
      instantWithdrawArgs({ account: "notanaddress" }),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it.for([
    ["notanaddress", 'Invalid address: "notanaddress"'],
    [zeroAddress, `Receiver cannot be the zero address: "${zeroAddress}"`],
  ])("rejects --receiver %s", async function ([value, message]) {
    const { exitCode, stderr } = await runCliRaw(
      instantWithdrawArgs({ receiver: value }),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain(message);
  });

  it.for([
    [
      ["--amount", amount, "--account", TEST_ADDRESS, "--receiver", receiver],
      "required option '--token <token>'",
    ],
    [
      ["--token", vusd.symbol, "--amount", amount, "--receiver", receiver],
      "required option '--account <addr>'",
    ],
    [
      ["--token", vusd.symbol, "--amount", amount, "--account", TEST_ADDRESS],
      "required option '--receiver <addr>'",
    ],
  ] as const)(
    "rejects a missing option: %s",
    async function ([extra, message]) {
      const { exitCode, stderr } = await runCliRaw(
        instantWithdrawOnFork([...extra]),
      );
      expect(exitCode).toBe(1);
      expect(stderr).toContain(message);
    },
  );
});
