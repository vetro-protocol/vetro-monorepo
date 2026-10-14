import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/core";
import { stakingVaultAbi } from "@vetro-protocol/earn";
import {
  getActiveRequestIds,
  getClaimableRequests,
  getTotalAssetsInCooldown,
} from "@vetro-protocol/earn/actions";
import {
  type Address,
  type Hex,
  decodeFunctionData,
  isAddressEqual,
  numberToHex,
  parseEventLogs,
  parseUnits,
} from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { getChainId, revert, snapshot } from "viem/actions";
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
  withdrawClaimedAbi,
} from "./helpers.ts";

const receiver = privateKeyToAddress(generatePrivateKey());
const untouchedAccount = privateKeyToAddress(generatePrivateKey());

describe("variable-yield claim-all", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient, testClient } = createClients(rpcUrl);
  const cooldownDuration = 86_400n;
  const vaults = [sVusdAddress, sVetBtcAddress];

  let snapshotId: Hex;

  const claimAllOnFork = (extra: string[] = []) => [
    "variable-yield",
    "claim-all",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  const claimAllArgs = ({
    account = TEST_ADDRESS,
    token = vusd.symbol,
  }: {
    account?: string;
    token?: string;
  } = {}) =>
    claimAllOnFork([
      "--token",
      token,
      "--account",
      account,
      "--receiver",
      receiver,
    ]);

  const decodeRequest = function (request: TransactionRequest) {
    const { args, functionName } = decodeFunctionData({
      abi: stakingVaultAbi,
      data: request.data,
    });
    const [requestIds, to] = args as [readonly bigint[], Address];
    return { functionName, requestIds, to };
  };

  const openTickets = async function ({
    amount = parseUnits("10", vusd.decimals),
    vault = sVusdAddress,
  }: {
    amount?: bigint;
    vault?: Address;
  } = {}) {
    const ready = [
      await requestWithdraw({ assets: amount, rpcUrl, vault }),
      await requestWithdraw({ assets: amount * 2n, rpcUrl, vault }),
    ];
    await fastForward({ rpcUrl, seconds: cooldownDuration });
    const cooldown = await requestWithdraw({ assets: amount, rpcUrl, vault });
    return { cooldown, ready };
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
        await openTickets();
        const request = await runCli<TransactionRequest>(claimAllArgs());
        expect(request.chainId).toBe(
          numberToHex(await getChainId(publicClient)),
        );
        expect(isAddressEqual(request.to, sVusdAddress)).toBe(true);
        expect(request.value).toBe("0x0");
      },
    });
  });

  it("encodes claimWithdrawBatch with every ready ticket, and none in cooldown", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const { ready } = await openTickets();
        const request = await runCli<TransactionRequest>(claimAllArgs());
        const { functionName, requestIds, to } = decodeRequest(request);
        expect(functionName).toBe("claimWithdrawBatch");
        expect(requestIds).toEqual(ready.map((ticket) => ticket.requestId));
        expect(isAddressEqual(to, receiver)).toBe(true);
      },
    });
  });

  it("encodes the same request by pegged or share token, by symbol or address", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        await openTickets();
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
            await runCli<TransactionRequest>(claimAllArgs({ token })),
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
        const { ready } = await openTickets({
          amount: parseUnits("0.01", vetBtc.decimals),
          vault: sVetBtcAddress,
        });
        const request = await runCli<TransactionRequest>(
          claimAllArgs({ token: vetBtc.symbol }),
        );
        expect(isAddressEqual(request.to, sVetBtcAddress)).toBe(true);
        expect(decodeRequest(request).requestIds).toEqual(
          ready.map((ticket) => ticket.requestId),
        );
      },
    });
  });

  it("pays every ready ticket's pegged token to the receiver once the calldata is broadcast", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const { cooldown, ready } = await openTickets();
        const readyAssets = ready.reduce(
          (total, ticket) => total + ticket.assets,
          0n,
        );
        const params = { account: TEST_ADDRESS, address: sVusdAddress };
        const [balanceBefore, inCooldownBefore] = await Promise.all([
          balanceOf(publicClient, { account: receiver, address: vusd.address }),
          getTotalAssetsInCooldown(publicClient, { address: sVusdAddress }),
        ]);

        await fastForward({ rpcUrl, seconds: 60n });
        const request = await runCli<TransactionRequest>(claimAllArgs());
        const receipt = await sendTransactionRequest({ request, rpcUrl });
        expect(receipt.status).toBe("success");

        const events = parseEventLogs({
          abi: withdrawClaimedAbi,
          logs: receipt.logs,
        });
        expect(events.map((event) => event.args.requestId)).toEqual(
          ready.map((ticket) => ticket.requestId),
        );
        expect(events.map((event) => event.args.assets)).toEqual(
          ready.map((ticket) => ticket.assets),
        );
        expect(
          events.every((event) =>
            isAddressEqual(event.args.receiver, receiver),
          ),
        ).toBe(true);

        const [balanceAfter, inCooldownAfter, [claimableIds], activeIds] =
          await Promise.all([
            balanceOf(publicClient, {
              account: receiver,
              address: vusd.address,
            }),
            getTotalAssetsInCooldown(publicClient, { address: sVusdAddress }),
            getClaimableRequests(publicClient, params),
            getActiveRequestIds(publicClient, params),
          ]);
        expect(balanceAfter - balanceBefore).toBe(readyAssets);
        expect(inCooldownBefore - inCooldownAfter).toBe(readyAssets);
        expect(claimableIds).toEqual([]);
        expect(activeIds).toEqual([cooldown.requestId]);
      },
    });
  });

  it("rejects an account whose exit tickets are all in cooldown", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        await requestWithdraw({
          assets: parseUnits("10", vusd.decimals),
          rpcUrl,
          vault: sVusdAddress,
        });

        const { exitCode, stderr } = await runCliRaw(claimAllArgs());
        expect(exitCode).toBe(1);
        expect(JSON.parse(stderr).error).toBe(
          `No ready exit ticket for "${TEST_ADDRESS}" on the vault of "${vusd.symbol}"`,
        );
      },
    });
  });

  it("rejects an account with no exit ticket", async function () {
    const { exitCode, stderr } = await runCliRaw(
      claimAllArgs({ account: untouchedAccount }),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `No ready exit ticket for "${untouchedAccount}" on the vault of "${vusd.symbol}"`,
    );
  });

  it("rejects a token that is not pegged or share", async function () {
    const { exitCode, stderr } = await runCliRaw(
      claimAllArgs({ token: usdc.symbol }),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a pegged or share token: "${usdc.symbol}"`,
    );
  });

  it("rejects an invalid --account", async function () {
    const { exitCode, stderr } = await runCliRaw(
      claimAllArgs({ account: "notanaddress" }),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it("rejects an invalid --receiver", async function () {
    const { exitCode, stderr } = await runCliRaw(
      claimAllOnFork([
        "--token",
        vusd.symbol,
        "--account",
        TEST_ADDRESS,
        "--receiver",
        "notanaddress",
      ]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it.for([
    [
      ["--account", TEST_ADDRESS, "--receiver", receiver],
      "required option '--token <token>'",
    ],
    [
      ["--token", vusd.symbol, "--receiver", receiver],
      "required option '--account <addr>'",
    ],
    [
      ["--token", vusd.symbol, "--account", TEST_ADDRESS],
      "required option '--receiver <addr>'",
    ],
  ] as const)(
    "rejects a missing option: %s",
    async function ([extra, message]) {
      const { exitCode, stderr } = await runCliRaw(claimAllOnFork([...extra]));
      expect(exitCode).toBe(1);
      expect(stderr).toContain(message);
    },
  );
});
