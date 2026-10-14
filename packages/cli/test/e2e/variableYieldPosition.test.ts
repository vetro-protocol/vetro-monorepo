import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/core";
import { type Address, parseUnits } from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { balanceOf, symbol } from "viem-erc20/actions";
import { convertToAssets } from "viem-erc4626/actions";
import { beforeAll, describe, expect, inject, it } from "vitest";

import {
  createClients,
  fundTestAccount,
  runCli,
  runCliRaw,
  stake,
  usdc,
  vetBtc,
  vusd,
} from "./helpers.ts";

type Position = { assets: string; shares: string };

const untouchedAccount = privateKeyToAddress(generatePrivateKey());

describe("variable-yield position", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient } = createClients(rpcUrl);

  const positionOnFork = (extra: string[] = []) => [
    "variable-yield",
    "position",
    ...extra,
    "--rpc-url",
    rpcUrl,
  ];

  const readPosition = async function (vault: Address) {
    const shares = await balanceOf(publicClient, {
      account: TEST_ADDRESS,
      address: vault,
    });
    const assets = await convertToAssets(publicClient, {
      address: vault,
      shares,
    });
    return { assets: assets.toString(), shares: shares.toString() };
  };

  beforeAll(async function () {
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

  it("reads the position by pegged or share token, by symbol or address", async function () {
    const expected = await readPosition(sVusdAddress);
    expect(BigInt(expected.shares)).toBeGreaterThan(0n);
    const shareSymbol = await symbol(publicClient, { address: sVusdAddress });

    const positions: Position[] = [];
    for (const token of [
      vusd.symbol,
      vusd.address,
      shareSymbol,
      sVusdAddress,
    ]) {
      positions.push(
        await runCli<Position>(
          positionOnFork(["--token", token, "--account", TEST_ADDRESS]),
        ),
      );
    }

    expect(positions).toEqual(Array(4).fill(expected));
  });

  it("reads the vault of the given token", async function () {
    const expected = await readPosition(sVetBtcAddress);
    expect(BigInt(expected.shares)).toBeGreaterThan(0n);

    const position = await runCli<Position>(
      positionOnFork(["--token", vetBtc.symbol, "--account", TEST_ADDRESS]),
    );

    expect(position).toEqual(expected);
  });

  it("prints a zero position for an account that never staked", async function () {
    const position = await runCli<Position>(
      positionOnFork(["--token", vusd.symbol, "--account", untouchedAccount]),
    );

    expect(position).toEqual({ assets: "0", shares: "0" });
  });

  it("rejects a token that is not pegged or share", async function () {
    const { exitCode, stderr } = await runCliRaw(
      positionOnFork(["--token", usdc.symbol, "--account", TEST_ADDRESS]),
    );
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not a pegged or share token: "${usdc.symbol}"`,
    );
  });

  it("rejects an invalid --account", async function () {
    const { exitCode, stderr } = await runCliRaw(
      positionOnFork(["--token", vusd.symbol, "--account", "notanaddress"]),
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
      const { exitCode, stderr } = await runCliRaw(positionOnFork([...extra]));
      expect(exitCode).toBe(1);
      expect(stderr).toContain(message);
    },
  );
});
