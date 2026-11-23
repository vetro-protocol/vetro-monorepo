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
      const { marketId, pair } = await resolveMarket({
        client,
        selector: options.market,
      });
      const [{ timestamp }, market] = await Promise.all([
        getBlock(client),
        fetchMarket(marketId as MarketId, client),
      ]);
      const accrued = market.accrueInterest(timestamp);
      printResult({
        // The borrowApy getter projects the rate to the wall clock, not to the block.
        borrowApy: accrued.getBorrowApy(timestamp),
        liquidity: accrued.liquidity,
        lltv: accrued.params.lltv,
        marketId,
        pair,
        price: accrued.price ?? null,
        totalBorrowAssets: accrued.totalBorrowAssets,
        totalSupplyAssets: accrued.totalSupplyAssets,
        utilization: accrued.utilization,
      });
    });
}
