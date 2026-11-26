import { type MarketId } from "@morpho-org/blue-sdk";
import { fetchMarket } from "@morpho-org/blue-sdk-viem";
import { type Command } from "commander";
import { getBlock } from "viem/actions";

import { type MarketSelector, parseMarket } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { resolveMarket } from "../../../lib/markets.ts";
import { printResult } from "../../../lib/output.ts";

export function register(borrow: Command) {
  borrow
    .command("market")
    .description(
      "Print the state of a market, with interest accrued to the latest block",
    )
    .requiredOption(
      "--market <market>",
      "Market, as <collateral>/<loan> (symbols or addresses) or a market id",
      parseMarket,
    )
    .action(async function (
      options: { market: MarketSelector },
      command: Command,
    ) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const [{ collateralToken, loanToken, marketId, pair }, block] =
        await Promise.all([
          resolveMarket({
            client,
            selector: options.market,
          }),
          getBlock(client),
        ]);
      const { timestamp } = block;
      const market = await fetchMarket(marketId as MarketId, client, {
        blockNumber: block.number,
      });
      const accrued = market.accrueInterest(timestamp);
      printResult({
        // The borrowApy getter projects the rate to the wall clock, not to the block.
        borrowApy: accrued.getBorrowApy(timestamp),
        collateralToken,
        liquidity: accrued.liquidity,
        lltv: accrued.params.lltv,
        loanToken,
        marketId,
        pair,
        price: accrued.price ?? null,
        totalBorrowAssets: accrued.totalBorrowAssets,
        totalSupplyAssets: accrued.totalSupplyAssets,
        utilization: accrued.utilization,
      });
    });
}
