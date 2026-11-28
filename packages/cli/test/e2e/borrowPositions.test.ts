import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { marketIds } from "@vetro-protocol/morpho-blue-market";
import { parseUnits } from "viem";
import { describe, expect, inject, it } from "vitest";

import {
  type BorrowPosition,
  fastForward,
  fundTestAccount,
  hemiBtc,
  openBorrowPosition,
  readExpectedPosition,
  runCli,
  runCliRaw,
  vusd,
  weth,
  withSnapshot,
} from "./helpers.ts";

describe("borrow positions", function () {
  const rpcUrl = inject("anvilUrl");
  const [hemiBtcMarket, wethMarket] = marketIds;

  const positionsOnFork = (account: string = TEST_ADDRESS) => [
    "borrow",
    "positions",
    "--account",
    account,
    "--rpc-url",
    rpcUrl,
  ];

  const openPosition = async function ({
    borrowAssets,
    marketId,
    token,
  }: {
    borrowAssets: bigint;
    marketId: (typeof marketIds)[number];
    token: typeof hemiBtc | typeof weth;
  }) {
    await fundTestAccount({ amount: "1", rpcUrl, token });
    await openBorrowPosition({
      borrowAssets,
      collateral: parseUnits("1", token.decimals),
      liquidity: borrowAssets,
      marketId,
      rpcUrl,
    });
  };

  it("prints an empty list when the account has no position", async function () {
    const positions = await runCli<BorrowPosition[]>(positionsOnFork());
    expect(positions).toEqual([]);
  });

  it("prints only the markets where the account has collateral or debt", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        await openPosition({
          borrowAssets: parseUnits("100", vusd.decimals),
          marketId: hemiBtcMarket,
          token: hemiBtc,
        });
        await fastForward({ rpcUrl, seconds: 86_400n });

        const positions = await runCli<BorrowPosition[]>(positionsOnFork());
        const expected = await readExpectedPosition({
          marketId: hemiBtcMarket,
          rpcUrl,
        });

        expect(BigInt(expected.position.borrowShares)).toBeGreaterThan(0n);
        expect(positions).toEqual([expected.position]);
      },
    });
  });

  it("prints a position with collateral only, in the order of the enabled markets", async function () {
    await withSnapshot({
      rpcUrl,
      async run() {
        await openPosition({
          borrowAssets: 0n,
          marketId: wethMarket,
          token: weth,
        });
        await openPosition({
          borrowAssets: parseUnits("100", vusd.decimals),
          marketId: hemiBtcMarket,
          token: hemiBtc,
        });

        const positions = await runCli<BorrowPosition[]>(positionsOnFork());
        const expected = [
          (await readExpectedPosition({ marketId: hemiBtcMarket, rpcUrl }))
            .position,
          (await readExpectedPosition({ marketId: wethMarket, rpcUrl }))
            .position,
        ];

        expect(expected[0].healthFactor).not.toBeNull();
        expect(expected[1].healthFactor).toBeNull();
        expect(positions).toEqual(expected);
      },
    });
  });

  it("rejects an invalid account", async function () {
    const { exitCode, stderr } = await runCliRaw(
      positionsOnFork("notanaddress"),
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it("rejects a missing account", async function () {
    const { exitCode, stderr } = await runCliRaw([
      "borrow",
      "positions",
      "--rpc-url",
      rpcUrl,
    ]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("required option '--account <addr>'");
  });
});
