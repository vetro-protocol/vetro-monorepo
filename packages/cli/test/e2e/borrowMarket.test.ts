import { TEST_ADDRESS } from "@hemilabs/anvil-fork-setup/utils";
import {
  adaptiveCurveIrmAbi,
  blueAbi,
  blueOracleAbi,
} from "@morpho-org/blue-sdk-viem";
import {
  marketIds,
  morphoBlueAddress,
} from "@vetro-protocol/morpho-blue-market";
import { type Hash, formatEther, keccak256, parseEther } from "viem";
import {
  getBlock,
  readContract,
  setBalance,
  setCode,
  setNextBlockTimestamp,
  writeContract,
} from "viem/actions";
import { symbol } from "viem-erc20/actions";
import { describe, expect, inject, it } from "vitest";

import {
  confirmWrite,
  createClients,
  fastForward,
  runCli,
  runCliRaw,
  withSnapshot,
} from "./helpers.ts";

type Market = {
  borrowApy: number;
  liquidity: string;
  lltv: string;
  marketId: Hash;
  pair: string;
  price: string | null;
  totalBorrowAssets: string;
  totalSupplyAssets: string;
  utilization: string;
};

describe("borrow market", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient, testClient, walletClient } = createClients(rpcUrl);

  const marketOnFork = (market: string) => [
    "borrow",
    "market",
    "--market",
    market,
    "--rpc-url",
    rpcUrl,
  ];

  const readMarketParams = async function (marketId: Hash) {
    const [loanToken, collateralToken, oracle, irm, lltv] = await readContract(
      publicClient,
      {
        abi: blueAbi,
        address: morphoBlueAddress,
        args: [marketId],
        functionName: "idToMarketParams",
      },
    );
    return { collateralToken, irm, lltv, loanToken, oracle };
  };

  const readMarketState = async function (marketId: Hash) {
    const [
      totalSupplyAssets,
      totalSupplyShares,
      totalBorrowAssets,
      totalBorrowShares,
      lastUpdate,
      fee,
    ] = await readContract(publicClient, {
      abi: blueAbi,
      address: morphoBlueAddress,
      args: [marketId],
      functionName: "market",
    });
    return {
      fee,
      lastUpdate,
      totalBorrowAssets,
      totalBorrowShares,
      totalSupplyAssets,
      totalSupplyShares,
    };
  };

  const readPair = async function (marketId: Hash) {
    const { collateralToken, loanToken } = await readMarketParams(marketId);
    const [collateral, loan] = await Promise.all([
      symbol(publicClient, { address: collateralToken }),
      symbol(publicClient, { address: loanToken }),
    ]);
    return { collateral, collateralToken, loan, loanToken };
  };

  const readEnabledPairs = async () =>
    (await Promise.all(marketIds.map(readPair)))
      .map(
        ({ collateral, loan }, index) =>
          `${collateral}/${loan} (${marketIds[index]})`,
      )
      .join(", ");

  it.for(marketIds)(
    "prints market %s with interest accrued to the latest block",
    async function (marketId) {
      await withSnapshot({
        rpcUrl,
        async run() {
          await fastForward({ rpcUrl, seconds: 86_400n });
          const stale = await readMarketState(marketId);
          const { collateral, loan } = await readPair(marketId);

          const market = await runCli<Market>(
            marketOnFork(`${collateral}/${loan}`),
          );

          const params = await readMarketParams(marketId);
          const latest = await getBlock(publicClient);
          await setBalance(testClient, {
            address: TEST_ADDRESS,
            value: parseEther("1"),
          });
          await setNextBlockTimestamp(testClient, {
            timestamp: latest.timestamp,
          });
          await confirmWrite({
            client: publicClient,
            hash: await writeContract(walletClient, {
              abi: blueAbi,
              address: morphoBlueAddress,
              args: [params],
              functionName: "accrueInterest",
            }),
          });

          const after = await readMarketState(marketId);
          const [price, borrowRate] = await Promise.all([
            readContract(publicClient, {
              abi: blueOracleAbi,
              address: params.oracle,
              functionName: "price",
            }),
            readContract(publicClient, {
              abi: adaptiveCurveIrmAbi,
              address: params.irm,
              args: [params, after],
              functionName: "borrowRateView",
            }),
          ]);

          expect(after.totalBorrowAssets).toBeGreaterThan(
            stale.totalBorrowAssets,
          );
          expect(market).toEqual({
            borrowApy: Math.expm1(
              Number(formatEther(borrowRate * 31_536_000n)),
            ),
            liquidity: (
              after.totalSupplyAssets - after.totalBorrowAssets
            ).toString(),
            lltv: params.lltv.toString(),
            marketId,
            pair: `${collateral}/${loan}`,
            price: price.toString(),
            totalBorrowAssets: after.totalBorrowAssets.toString(),
            totalSupplyAssets: after.totalSupplyAssets.toString(),
            utilization: (
              (after.totalBorrowAssets * parseEther("1")) /
              after.totalSupplyAssets
            ).toString(),
          });
        },
      });
    },
  );

  it.for(marketIds)(
    "resolves market %s by addresses, mixed case and id",
    async function (marketId) {
      const { collateral, collateralToken, loan, loanToken } =
        await readPair(marketId);
      const mixedCase = (value: string) =>
        [...value]
          .map((char, index) =>
            index % 2 === 0 ? char.toUpperCase() : char.toLowerCase(),
          )
          .join("");

      const reference = await runCli<Market>(
        marketOnFork(`${collateral}/${loan}`),
      );
      const byAddresses = await runCli<Market>(
        marketOnFork(
          `${collateralToken.toLowerCase()}/${loanToken.toLowerCase()}`,
        ),
      );
      const byMixedCase = await runCli<Market>(
        marketOnFork(`${mixedCase(collateral)}/${mixedCase(loan)}`),
      );
      const byId = await runCli<Market>(marketOnFork(marketId));

      expect(reference.marketId).toBe(marketId);
      expect(byAddresses).toEqual(reference);
      expect(byMixedCase).toEqual(reference);
      expect(byId).toEqual(reference);
    },
  );

  it("prints a null price when the oracle reverts", async function () {
    const [marketId] = marketIds;
    await withSnapshot({
      rpcUrl,
      async run() {
        const { oracle } = await readMarketParams(marketId);
        await setCode(testClient, {
          address: oracle,
          bytecode: "0x60006000fd",
        });

        const market = await runCli<Market>(marketOnFork(marketId));
        expect(market.price).toBeNull();
      },
    });
  });

  it("resolves a market id when another market cannot be read", async function () {
    const [marketId, otherMarketId] = marketIds;
    await withSnapshot({
      rpcUrl,
      async run() {
        const { collateral, loan } = await readPair(marketId);
        const { collateralToken } = await readMarketParams(otherMarketId);
        await setCode(testClient, {
          address: collateralToken,
          bytecode: "0x60006000fd",
        });

        const market = await runCli<Market>(marketOnFork(marketId));
        expect(market.marketId).toBe(marketId);
        const { exitCode } = await runCliRaw(
          marketOnFork(`${collateral}/${loan}`),
        );
        expect(exitCode).toBe(1);
      },
    });
  });

  it("rejects a pair with its sides reversed, listing the enabled pairs", async function () {
    const [marketId] = marketIds;
    const { collateral, loan } = await readPair(marketId);
    const value = `${loan}/${collateral}`;

    const { exitCode, stderr } = await runCliRaw(marketOnFork(value));
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not an enabled market: "${value}". Enabled markets: ${await readEnabledPairs()}`,
    );
  });

  it("rejects a market id that is not enabled, listing the enabled pairs", async function () {
    const value = keccak256("0x00");

    const { exitCode, stderr } = await runCliRaw(marketOnFork(value));
    expect(exitCode).toBe(1);
    expect(JSON.parse(stderr).error).toBe(
      `Not an enabled market: "${value}". Enabled markets: ${await readEnabledPairs()}`,
    );
  });

  it("rejects a market that is not a pair or a market id", async function () {
    const { exitCode, stderr } = await runCliRaw(marketOnFork("hemiBTC"));
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Invalid market: "hemiBTC"');
  });
});
