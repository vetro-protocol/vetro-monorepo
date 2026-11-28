import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import { blueAbi } from "@morpho-org/blue-sdk-viem";
import {
  marketIds,
  morphoBlueAddress,
} from "@vetro-protocol/morpho-blue-market";
import { type Hash, isAddressEqual, maxUint256, parseUnits } from "viem";
import { readContract, setCode } from "viem/actions";
import { describe, expect, inject, it } from "vitest";

import {
  type BorrowPosition,
  createClients,
  fastForward,
  fundTestAccount,
  hemiBtc,
  openBorrowPosition,
  readExpectedPosition,
  readMarketParams,
  runCli,
  runCliRaw,
  vusd,
  weth,
  withSnapshot,
} from "./helpers.ts";

describe("borrow position", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient, testClient } = createClients(rpcUrl);

  const positionOnFork = (market: string) => [
    "borrow",
    "position",
    "--market",
    market,
    "--account",
    TEST_ADDRESS,
    "--rpc-url",
    rpcUrl,
  ];

  const fundCollateral = async function ({
    amount = "1",
    marketId,
  }: {
    amount?: string;
    marketId: Hash;
  }) {
    const { collateralToken } = await readMarketParams({
      client: publicClient,
      marketId,
    });
    const token = [hemiBtc, weth].find((candidate) =>
      isAddressEqual(candidate.address, collateralToken),
    )!;
    await fundTestAccount({ amount, rpcUrl, token });
    return parseUnits(amount, token.decimals);
  };

  it.for(marketIds)(
    "prints zeros and nulls in market %s when the account has no position",
    async function (marketId) {
      const onChain = await readContract(publicClient, {
        abi: blueAbi,
        address: morphoBlueAddress,
        args: [marketId, TEST_ADDRESS],
        functionName: "position",
      });
      expect(onChain).toEqual([0n, 0n, 0n]);

      const position = await runCli<BorrowPosition>(positionOnFork(marketId));
      expect(position).toEqual({
        borrowAssets: "0",
        borrowShares: "0",
        collateral: "0",
        healthFactor: null,
        liquidationPrice: null,
        ltv: null,
        marketId,
        maxBorrow: "0",
        withdrawableCollateral: "0",
      });
    },
  );

  const liquidity = parseUnits("1000000", vusd.decimals);

  it.for(marketIds)(
    "prints a position with collateral only in market %s, limited by the collateral",
    async function (marketId) {
      await withSnapshot({
        rpcUrl,
        async run() {
          const collateral = await fundCollateral({ marketId });
          await openBorrowPosition({
            borrowAssets: 0n,
            collateral,
            liquidity,
            marketId,
            rpcUrl,
          });

          const position = await runCli<BorrowPosition>(
            positionOnFork(marketId),
          );
          const expected = await readExpectedPosition({ marketId, rpcUrl });

          expect(expected.maxBorrowAssets).toBeGreaterThan(0n);
          expect(expected.maxBorrowAssets).toBeLessThan(expected.liquidity);
          expect(position).toEqual({
            ...expected.position,
            collateral: collateral.toString(),
            healthFactor: null,
            liquidationPrice: null,
            ltv: null,
            maxBorrow: expected.maxBorrowAssets!.toString(),
            withdrawableCollateral: collateral.toString(),
          });
        },
      });
    },
  );

  it("caps the max borrow at the market liquidity", async function () {
    const [marketId] = marketIds;
    await withSnapshot({
      rpcUrl,
      async run() {
        await openBorrowPosition({
          borrowAssets: 0n,
          collateral: await fundCollateral({ amount: "1000", marketId }),
          liquidity: 0n,
          marketId,
          rpcUrl,
        });

        const position = await runCli<BorrowPosition>(positionOnFork(marketId));
        const expected = await readExpectedPosition({ marketId, rpcUrl });

        expect(expected.maxBorrowAssets).toBeGreaterThan(expected.liquidity);
        expect(position).toEqual({
          ...expected.position,
          maxBorrow: expected.liquidity.toString(),
        });
      },
    });
  });

  it.for(marketIds)(
    "prints a position with debt in market %s, with interest accrued to the latest block",
    async function (marketId) {
      await withSnapshot({
        rpcUrl,
        async run() {
          const borrowAssets = parseUnits("100", vusd.decimals);
          await openBorrowPosition({
            borrowAssets,
            collateral: await fundCollateral({ marketId }),
            liquidity,
            marketId,
            rpcUrl,
          });
          await fastForward({ rpcUrl, seconds: 86_400n });

          const position = await runCli<BorrowPosition>(
            positionOnFork(marketId),
          );
          const expected = await readExpectedPosition({ marketId, rpcUrl });
          const debt = BigInt(expected.position.borrowAssets);

          expect(debt).toBeGreaterThan(borrowAssets);
          expect(expected.position.healthFactor).not.toBeNull();
          expect(expected.maxBorrowAssets! - debt).toBeLessThan(
            expected.liquidity,
          );
          expect(position).toEqual({
            ...expected.position,
            maxBorrow: (expected.maxBorrowAssets! - debt).toString(),
          });
        },
      });
    },
  );

  it("prints null for the values that need a price when the oracle reverts", async function () {
    const [marketId] = marketIds;
    await withSnapshot({
      rpcUrl,
      async run() {
        await openBorrowPosition({
          borrowAssets: parseUnits("100", vusd.decimals),
          collateral: await fundCollateral({ marketId }),
          liquidity,
          marketId,
          rpcUrl,
        });
        const { oracle } = await readMarketParams({
          client: publicClient,
          marketId,
        });
        await setCode(testClient, {
          address: oracle,
          bytecode: "0x60006000fd",
        });

        const position = await runCli<BorrowPosition>(positionOnFork(marketId));
        const expected = await readExpectedPosition({ marketId, rpcUrl });

        expect(expected.position.liquidationPrice).not.toBeNull();
        expect(position).toEqual({
          ...expected.position,
          healthFactor: null,
          ltv: null,
          maxBorrow: null,
          withdrawableCollateral: null,
        });
      },
    });
  });

  it("prints 2^256 - 1 as the liquidation price when the collateral at the LLTV rounds to 0", async function () {
    const [marketId] = marketIds;
    await withSnapshot({
      rpcUrl,
      async run() {
        await openBorrowPosition({
          borrowAssets: parseUnits("0.0001", vusd.decimals),
          collateral: await fundCollateral({ amount: "0.00000001", marketId }),
          liquidity,
          marketId,
          rpcUrl,
        });

        const position = await runCli<BorrowPosition>(positionOnFork(marketId));
        const expected = await readExpectedPosition({ marketId, rpcUrl });

        expect(position.collateral).toBe("1");
        expect(position).toEqual({
          ...expected.position,
          liquidationPrice: maxUint256.toString(),
        });
      },
    });
  });

  it("prints the values that need a price when the oracle price is 0", async function () {
    const [marketId] = marketIds;
    await withSnapshot({
      rpcUrl,
      async run() {
        await openBorrowPosition({
          borrowAssets: parseUnits("100", vusd.decimals),
          collateral: await fundCollateral({ marketId }),
          liquidity,
          marketId,
          rpcUrl,
        });
        const { oracle } = await readMarketParams({
          client: publicClient,
          marketId,
        });
        await setCode(testClient, {
          address: oracle,
          bytecode: "0x60206000f3",
        });

        const position = await runCli<BorrowPosition>(positionOnFork(marketId));
        const expected = await readExpectedPosition({ marketId, rpcUrl });

        expect(expected.position.liquidationPrice).not.toBeNull();
        expect(position).toEqual({
          ...expected.position,
          healthFactor: "0",
          ltv: maxUint256.toString(),
          maxBorrow: "0",
          withdrawableCollateral: "0",
        });
      },
    });
  });

  it("prints the full collateral as withdrawable without debt when the oracle reverts", async function () {
    const [marketId] = marketIds;
    await withSnapshot({
      rpcUrl,
      async run() {
        const collateral = await fundCollateral({ marketId });
        await openBorrowPosition({
          borrowAssets: 0n,
          collateral,
          liquidity: 0n,
          marketId,
          rpcUrl,
        });
        const { oracle } = await readMarketParams({
          client: publicClient,
          marketId,
        });
        await setCode(testClient, {
          address: oracle,
          bytecode: "0x60006000fd",
        });

        const position = await runCli<BorrowPosition>(positionOnFork(marketId));

        expect(position).toEqual({
          borrowAssets: "0",
          borrowShares: "0",
          collateral: collateral.toString(),
          healthFactor: null,
          liquidationPrice: null,
          ltv: null,
          marketId,
          maxBorrow: null,
          withdrawableCollateral: collateral.toString(),
        });
      },
    });
  });

  it("resolves the market by pair and by id to the same position", async function () {
    const [marketId] = marketIds;
    await withSnapshot({
      rpcUrl,
      async run() {
        await openBorrowPosition({
          borrowAssets: 0n,
          collateral: await fundCollateral({ marketId }),
          liquidity: 0n,
          marketId,
          rpcUrl,
        });

        const byId = await runCli<BorrowPosition>(positionOnFork(marketId));
        const byPair = await runCli<BorrowPosition>(
          positionOnFork(`${hemiBtc.symbol}/${vusd.symbol}`),
        );
        expect(byId.collateral).not.toBe("0");
        expect(byPair).toEqual(byId);
      },
    });
  });

  it("rejects an invalid account", async function () {
    const { exitCode, stderr } = await runCliRaw([
      "borrow",
      "position",
      "--market",
      marketIds[0],
      "--account",
      "notanaddress",
      "--rpc-url",
      rpcUrl,
    ]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid address: "notanaddress"');
  });

  it.for([
    [["--account", TEST_ADDRESS], "required option '--market <market>'"],
    [["--market", marketIds[0]], "required option '--account <addr>'"],
  ] as const)(
    "rejects a missing option: %s",
    async function ([extra, message]) {
      const { exitCode, stderr } = await runCliRaw([
        "borrow",
        "position",
        ...extra,
        "--rpc-url",
        rpcUrl,
      ]);
      expect(exitCode).toBe(1);
      expect(stderr).toContain(message);
    },
  );
});
