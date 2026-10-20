import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/core";
import { stakingVaultAbi } from "@vetro-protocol/earn";
import {
  getActiveRequestIds,
  getClaimableRequests,
  getRequestDetails,
  getTotalAssetsInCooldown,
} from "@vetro-protocol/earn/actions";
import {
  type Address,
  type Hex,
  decodeFunctionData,
  isAddressEqual,
  numberToHex,
  parseAbi,
  parseEventLogs,
  parseUnits,
} from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { getBlock, getChainId, revert, snapshot } from "viem/actions";
import { balanceOf, symbol } from "viem-erc20/actions";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import {
  type TransactionRequest,
  createClients,
  fastForward,
  fundTestAccount,
  requestWithdraw,
  runCli,
  runCliRaw,
  sendTransactionRequest,
  setStakingCooldown,
  stake,
  usdc,
  vetBtc,
  vusd,
  withSnapshot,
} from "./helpers.ts";

const receiver = privateKeyToAddress(generatePrivateKey());

const withdrawClaimedAbi = parseAbi([
  "event WithdrawClaimed(address indexed owner, address indexed receiver, uint256 indexed requestId, uint256 assets)",
]);

describe("variable-yield claim", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient, testClient } = createClients(rpcUrl);
  const cooldownDuration = 86_400n;
  const vaults = [sVusdAddress, sVetBtcAddress];
  const assets = parseUnits("10", vusd.decimals);

  let snapshotId: Hex;

  const claimOnFork = (extra: string[] = []) => [
    "variable-yield",
    "claim",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  const claimArgs = ({
    requestId,
    token = vusd.symbol,
  }: {
    requestId: bigint | string;
    token?: string;
  }) =>
    claimOnFork([
      "--token",
      token,
      "--request-id",
      requestId.toString(),
      "--receiver",
      receiver,
    ]);

  const decodeRequest = function (request: TransactionRequest) {
    const { args, functionName } = decodeFunctionData({
      abi: stakingVaultAbi,
      data: request.data,
    });
    const [requestId, to] = args as [bigint, Address];
    return { functionName, requestId, to };
  };

  const openReadyTicket = async function ({
    amount = assets,
    vault = sVusdAddress,
  }: {
    amount?: bigint;
    vault?: Address;
  } = {}) {
    const ticket = await requestWithdraw({ assets: amount, rpcUrl, vault });
    await fastForward({ rpcUrl, seconds: cooldownDuration });
    return ticket;
  };

  beforeAll(async function () {
    snapshotId = await snapshot(testClient);
    for (const vault of vaults) {
      await setStakingCooldown({
        duration: cooldownDuration,
        enabled: true,
        rpcUrl,
        vault,
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
    await withSnapshot({
      rpcUrl,
      async run() {
        const ticket = await openReadyTicket();
        const request = await runCli<TransactionRequest>(
          claimArgs({ requestId: ticket.requestId }),
        );
        expect(request.chainId).toBe(
          numberToHex(await getChainId(publicClient)),
        );
        expect(isAddressEqual(request.to, sVusdAddress)).toBe(true);
        expect(request.value).toBe("0x0");
      },
    });
  });

  it("encodes claimWithdraw(requestId, receiver) as given", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const ticket = await openReadyTicket();
        const request = await runCli<TransactionRequest>(
          claimArgs({ requestId: ticket.requestId }),
        );
        const { functionName, requestId, to } = decodeRequest(request);
        expect(functionName).toBe("claimWithdraw");
        expect(requestId).toBe(ticket.requestId);
        expect(isAddressEqual(to, receiver)).toBe(true);
      },
    });
  });

  it("encodes the same request by pegged or share token, by symbol or address", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const ticket = await openReadyTicket();
        const shareSymbol = await symbol(publicClient, {
          address: sVusdAddress,
        });

        const requests: TransactionRequest[] = [];
        for (const token of [
          vusd.symbol,
          vusd.address,
          shareSymbol,
          sVusdAddress,
        ]) {
          requests.push(
            await runCli<TransactionRequest>(
              claimArgs({ requestId: ticket.requestId, token }),
            ),
          );
        }

        expect(requests).toEqual(Array(4).fill(requests[0]));
      },
    });
  });

  it("targets the vault of the given token", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const ticket = await openReadyTicket({
          amount: parseUnits("0.01", vetBtc.decimals),
          vault: sVetBtcAddress,
        });
        const request = await runCli<TransactionRequest>(
          claimArgs({ requestId: ticket.requestId, token: vetBtc.symbol }),
        );
        expect(isAddressEqual(request.to, sVetBtcAddress)).toBe(true);
        expect(decodeRequest(request).requestId).toBe(ticket.requestId);
      },
    });
  });

  it("pays the ticket's pegged token to the receiver once the calldata is broadcast", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const ticket = await openReadyTicket();
        const params = { account: TEST_ADDRESS, address: sVusdAddress };
        const [balanceBefore, inCooldownBefore] = await Promise.all([
          balanceOf(publicClient, { account: receiver, address: vusd.address }),
          getTotalAssetsInCooldown(publicClient, { address: sVusdAddress }),
        ]);

        const request = await runCli<TransactionRequest>(
          claimArgs({ requestId: ticket.requestId }),
        );
        const receipt = await sendTransactionRequest({ request, rpcUrl });
        expect(receipt.status).toBe("success");

        const [{ args: event }] = parseEventLogs({
          abi: withdrawClaimedAbi,
          logs: receipt.logs,
        });
        expect(event.requestId).toBe(ticket.requestId);
        expect(event.assets).toBe(ticket.assets);
        expect(isAddressEqual(event.receiver, receiver)).toBe(true);

        const [
          balanceAfter,
          inCooldownAfter,
          details,
          [claimableIds],
          activeIds,
        ] = await Promise.all([
          balanceOf(publicClient, { account: receiver, address: vusd.address }),
          getTotalAssetsInCooldown(publicClient, { address: sVusdAddress }),
          getRequestDetails(publicClient, {
            address: sVusdAddress,
            requestId: ticket.requestId,
          }),
          getClaimableRequests(publicClient, params),
          getActiveRequestIds(publicClient, params),
        ]);
        expect(balanceAfter - balanceBefore).toBe(ticket.assets);
        expect(inCooldownBefore - inCooldownAfter).toBe(ticket.assets);
        expect(details.assets).toBe(0n);
        expect(claimableIds).not.toContain(ticket.requestId);
        expect(activeIds).not.toContain(ticket.requestId);
      },
    });
  });

  it("claims a ready ticket when the cooldown was disabled after it was opened", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const ticket = await openReadyTicket();
        await setStakingCooldown({
          enabled: false,
          rpcUrl,
          vault: sVusdAddress,
        });
        const balanceBefore = await balanceOf(publicClient, {
          account: receiver,
          address: vusd.address,
        });

        const request = await runCli<TransactionRequest>(
          claimArgs({ requestId: ticket.requestId }),
        );
        const receipt = await sendTransactionRequest({ request, rpcUrl });

        expect(receipt.status).toBe("success");
        const balanceAfter = await balanceOf(publicClient, {
          account: receiver,
          address: vusd.address,
        });
        expect(balanceAfter - balanceBefore).toBe(ticket.assets);
      },
    });
  });

  it("rejects a ticket that is still in cooldown", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const ticket = await requestWithdraw({
          assets,
          rpcUrl,
          vault: sVusdAddress,
        });
        const { timestamp } = await getBlock(publicClient);
        expect(timestamp).toBeLessThan(ticket.claimableAt);

        const { exitCode, stderr } = await runCliRaw(
          claimArgs({ requestId: ticket.requestId }),
        );
        expect(exitCode).toBe(1);
        expect(JSON.parse(stderr).error).toBe(
          `Exit ticket "${ticket.requestId}" is still in cooldown: it is ready at ${ticket.claimableAt}, and the latest block is at ${timestamp}`,
        );
      },
    });
  });

  it("rejects a ticket that was already claimed", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const ticket = await openReadyTicket();
        const request = await runCli<TransactionRequest>(
          claimArgs({ requestId: ticket.requestId }),
        );
        const receipt = await sendTransactionRequest({ request, rpcUrl });
        expect(receipt.status).toBe("success");

        const { exitCode, stderr } = await runCliRaw(
          claimArgs({ requestId: ticket.requestId }),
        );
        expect(exitCode).toBe(1);
        expect(JSON.parse(stderr).error).toBe(
          `No open exit ticket "${ticket.requestId}" on the vault of "${vusd.symbol}": it was never opened, or it was claimed or cancelled`,
        );
      },
    });
  });

  it("rejects a request id that was never opened", async function () {
    const requestId = (2n ** 64n).toString();
    const { exitCode, stderr } = await runCliRaw(claimArgs({ requestId }));
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `No open exit ticket "${requestId}" on the vault of "${vusd.symbol}": it was never opened, or it was claimed or cancelled`,
    );
  });

  it("rejects a token that is not pegged or share", async function () {
    const { exitCode, stderr } = await runCliRaw(
      claimArgs({ requestId: "1", token: usdc.symbol }),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a pegged or share token: "${usdc.symbol}"`,
    );
  });

  it.for(["abc", "-1"])(
    "rejects --request-id %s as a usage error",
    async function (value) {
      const { exitCode, stderr } = await runCliRaw(
        claimArgs({ requestId: value }),
      );
      expect(exitCode).toBe(1);
      expect(stderr).toContain(`Invalid request id: "${value}"`);
    },
  );

  it("rejects an invalid --receiver", async function () {
    const { exitCode, stderr } = await runCliRaw(
      claimOnFork([
        "--token",
        vusd.symbol,
        "--request-id",
        "1",
        "--receiver",
        "notanaddress",
      ]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it.for([
    [
      ["--request-id", "1", "--receiver", receiver],
      "required option '--token <token>'",
    ],
    [
      ["--token", vusd.symbol, "--receiver", receiver],
      "required option '--request-id <id>'",
    ],
    [
      ["--token", vusd.symbol, "--request-id", "1"],
      "required option '--receiver <addr>'",
    ],
  ] as const)(
    "rejects a missing option: %s",
    async function ([extra, message]) {
      const { exitCode, stderr } = await runCliRaw(claimOnFork([...extra]));
      expect(exitCode).toBe(1);
      expect(stderr).toContain(message);
    },
  );
});
