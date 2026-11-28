import {
  marketIds,
  morphoBlueAbi,
  morphoBlueAddress,
} from "@vetro-protocol/morpho-blue-market";
import {
  type Address,
  type Hash,
  encodeAbiParameters,
  keccak256,
  zeroHash,
} from "viem";
import { readContract, setStorageAt } from "viem/actions";
import { decimals, symbol } from "viem-erc20/actions";
import { describe, expect, inject, it } from "vitest";

import { createClients, runCli, runCliRaw, withSnapshot } from "./helpers.ts";

type MarketToken = {
  address: Address;
  decimals: number;
  symbol: string;
};

type Market = {
  collateralToken: MarketToken;
  irm: Address;
  lltv: string;
  loanToken: MarketToken;
  marketId: Hash;
  oracle: Address;
  pair: string;
};

describe("borrow markets", function () {
  const rpcUrl = inject("anvilUrl");
  const { publicClient, testClient } = createClients(rpcUrl);

  const readTokenOnChain = async (address: Address) => ({
    address,
    decimals: await decimals(publicClient, { address }),
    symbol: await symbol(publicClient, { address }),
  });

  const readMarketOnChain = async function (marketId: Hash) {
    const [loanToken, collateralToken, oracle, irm, lltv] = await readContract(
      publicClient,
      {
        abi: morphoBlueAbi,
        address: morphoBlueAddress,
        args: [marketId],
        functionName: "idToMarketParams",
      },
    );
    const [collateral, loan] = await Promise.all([
      readTokenOnChain(collateralToken),
      readTokenOnChain(loanToken),
    ]);
    return {
      collateralToken: collateral,
      irm,
      lltv: lltv.toString(),
      loanToken: loan,
      marketId,
      oracle,
      pair: `${collateral.symbol}/${loan.symbol}`,
    };
  };

  it("prints each enabled market as Morpho Blue stores it", async function () {
    const markets = await runCli<Market[]>([
      "borrow",
      "markets",
      "--rpc-url",
      rpcUrl,
    ]);

    const expected = await Promise.all(marketIds.map(readMarketOnChain));
    expect(markets).toEqual(expected);
  });

  it("rejects a market id that Morpho Blue does not know", async function () {
    const [marketId] = marketIds;
    await withSnapshot({
      rpcUrl,
      async run() {
        await setStorageAt(testClient, {
          address: morphoBlueAddress,
          // Slot 8 is idToMarketParams; its first word is the loan token.
          index: keccak256(
            encodeAbiParameters(
              [{ type: "bytes32" }, { type: "uint256" }],
              [marketId, 8n],
            ),
          ),
          value: zeroHash,
        });

        const { exitCode, stderr } = await runCliRaw([
          "borrow",
          "markets",
          "--rpc-url",
          rpcUrl,
        ]);
        expect(exitCode).toBe(1);
        expect(JSON.parse(stderr).error).toBe(
          `Unknown market "${marketId}": Morpho Blue has no market with this id`,
        );
      },
    });
  });
});
