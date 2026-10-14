import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/core";
import { stakingVaultAbi } from "@vetro-protocol/earn";
import {
  getCooldownDuration,
  getCooldownEnabled,
} from "@vetro-protocol/earn/actions";
import { type Address, parseUnits } from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { symbol } from "viem-erc20/actions";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

import {
  createClients,
  fastForward,
  fundTestAccount,
  requestWithdraw,
  runCli,
  runCliRaw,
  setStakingCooldown,
  stake,
  usdc,
  vetBtc,
  vusd,
  withSnapshot,
} from "./helpers.ts";

type ExitTicket = {
  assets: string;
  claimableAt: string | null;
  requestId: string;
  status: "cooldown" | "ready";
};

type WithdrawRequest = {
  assets: bigint;
  claimableAt: bigint;
  requestId: bigint;
};

const untouchedAccount = privateKeyToAddress(generatePrivateKey());

const cooldownTicket = ({
  assets,
  claimableAt,
  requestId,
}: WithdrawRequest) => ({
  assets: assets.toString(),
  claimableAt: claimableAt.toString(),
  requestId: requestId.toString(),
  status: "cooldown",
});

const readyTicket = ({ assets, requestId }: WithdrawRequest) => ({
  assets: assets.toString(),
  claimableAt: null,
  requestId: requestId.toString(),
  status: "ready",
});

describe("variable-yield exit-tickets", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient, walletClient } = createClients(rpcUrl);
  const cooldownDuration = 86_400n;
  const vaults = [sVusdAddress, sVetBtcAddress];

  const exitTicketsOnFork = (extra: string[] = []) => [
    "variable-yield",
    "exit-tickets",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  const cancelWithdraw = async function ({
    requestId,
    vault,
  }: {
    requestId: bigint;
    vault: Address;
  }) {
    await fastForward({ rpcUrl, seconds: 60n });
    const hash = await writeContract(walletClient, {
      abi: stakingVaultAbi,
      address: vault,
      args: [requestId],
      functionName: "cancelWithdraw",
    });
    const { status } = await waitForTransactionReceipt(publicClient, { hash });
    expect(status).toBe("success");
  };

  let before: { duration: bigint; enabled: boolean }[];

  beforeAll(async function () {
    before = await Promise.all(
      vaults.map(async (vault) => ({
        duration: await getCooldownDuration(publicClient, { address: vault }),
        enabled: await getCooldownEnabled(publicClient, { address: vault }),
      })),
    );
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

  afterAll(async function () {
    for (const [index, vault] of vaults.entries()) {
      await setStakingCooldown({ ...before[index], rpcUrl, vault });
    }
  });

  it("prints no ticket for an account that never unstaked", async function () {
    const tickets = await runCli<ExitTicket[]>(
      exitTicketsOnFork([
        "--token",
        vusd.symbol,
        "--account",
        untouchedAccount,
      ]),
    );

    expect(tickets).toEqual([]);
  });

  it("prints the tickets in cooldown by pegged or share token, by symbol or address", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const first = await requestWithdraw({
          assets: parseUnits("10", vusd.decimals),
          rpcUrl,
          vault: sVusdAddress,
        });
        const second = await requestWithdraw({
          assets: parseUnits("20", vusd.decimals),
          rpcUrl,
          vault: sVusdAddress,
        });
        const shareSymbol = await symbol(publicClient, {
          address: sVusdAddress,
        });

        const results: ExitTicket[][] = [];
        for (const token of [
          vusd.symbol,
          vusd.address,
          shareSymbol,
          sVusdAddress,
        ]) {
          results.push(
            await runCli<ExitTicket[]>(
              exitTicketsOnFork(["--token", token, "--account", TEST_ADDRESS]),
            ),
          );
        }

        expect(results).toEqual(
          Array(4).fill([cooldownTicket(first), cooldownTicket(second)]),
        );
      },
    });
  });

  it("prints a ticket as ready, with no claimableAt, once its cooldown ends", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const request = await requestWithdraw({
          assets: parseUnits("10", vusd.decimals),
          rpcUrl,
          vault: sVusdAddress,
        });
        await fastForward({ rpcUrl, seconds: cooldownDuration });

        const tickets = await runCli<ExitTicket[]>(
          exitTicketsOnFork([
            "--token",
            vusd.symbol,
            "--account",
            TEST_ADDRESS,
          ]),
        );

        expect(tickets).toEqual([readyTicket(request)]);
      },
    });
  });

  it("prints ready tickets and tickets in cooldown together, by requestId", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const ready = await requestWithdraw({
          assets: parseUnits("10", vusd.decimals),
          rpcUrl,
          vault: sVusdAddress,
        });
        await fastForward({ rpcUrl, seconds: cooldownDuration });
        const pending = await requestWithdraw({
          assets: parseUnits("20", vusd.decimals),
          rpcUrl,
          vault: sVusdAddress,
        });

        const tickets = await runCli<ExitTicket[]>(
          exitTicketsOnFork([
            "--token",
            vusd.symbol,
            "--account",
            TEST_ADDRESS,
          ]),
        );

        expect(tickets).toEqual([readyTicket(ready), cooldownTicket(pending)]);
      },
    });
  });

  it("skips a cancelled ticket and keeps the others by requestId", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const cancelled = await requestWithdraw({
          assets: parseUnits("10", vusd.decimals),
          rpcUrl,
          vault: sVusdAddress,
        });
        const second = await requestWithdraw({
          assets: parseUnits("20", vusd.decimals),
          rpcUrl,
          vault: sVusdAddress,
        });
        const third = await requestWithdraw({
          assets: parseUnits("30", vusd.decimals),
          rpcUrl,
          vault: sVusdAddress,
        });
        await cancelWithdraw({
          requestId: cancelled.requestId,
          vault: sVusdAddress,
        });

        const tickets = await runCli<ExitTicket[]>(
          exitTicketsOnFork([
            "--token",
            vusd.symbol,
            "--account",
            TEST_ADDRESS,
          ]),
        );

        expect(tickets).toEqual([
          cooldownTicket(second),
          cooldownTicket(third),
        ]);
      },
    });
  });

  it("reads the vault of the given token", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        const vusdRequest = await requestWithdraw({
          assets: parseUnits("10", vusd.decimals),
          rpcUrl,
          vault: sVusdAddress,
        });
        const vetBtcRequest = await requestWithdraw({
          assets: parseUnits("0.01", vetBtc.decimals),
          rpcUrl,
          vault: sVetBtcAddress,
        });

        const results: ExitTicket[][] = [];
        for (const token of [vusd.symbol, vetBtc.symbol]) {
          results.push(
            await runCli<ExitTicket[]>(
              exitTicketsOnFork(["--token", token, "--account", TEST_ADDRESS]),
            ),
          );
        }

        expect(results).toEqual([
          [cooldownTicket(vusdRequest)],
          [cooldownTicket(vetBtcRequest)],
        ]);
      },
    });
  });

  it("rejects a token that is not pegged or share", async function () {
    const { exitCode, stderr } = await runCliRaw(
      exitTicketsOnFork(["--token", usdc.symbol, "--account", TEST_ADDRESS]),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a pegged or share token: "${usdc.symbol}"`,
    );
  });

  it("rejects an invalid --account", async function () {
    const { exitCode, stderr } = await runCliRaw(
      exitTicketsOnFork(["--token", vusd.symbol, "--account", "notanaddress"]),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it.for([
    [["--account", TEST_ADDRESS], "required option '--token <token>'"],
    [["--token", vusd.symbol], "required option '--account <addr>'"],
  ] as const)(
    "rejects a missing option: %s",
    async function ([extra, message]) {
      const { exitCode, stderr } = await runCliRaw(
        exitTicketsOnFork([...extra]),
      );
      expect(exitCode).toBe(1);
      expect(stderr).toContain(message);
    },
  );
});
