import { type Command } from "commander";
import { type Address } from "viem";
import { getBlock } from "viem/actions";

import {
  type MarketSelector,
  parseAddress,
  parseMarket,
} from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { resolveMarket } from "../../../lib/markets.ts";
import { printResult } from "../../../lib/output.ts";
import { readPosition } from "../../../lib/positions.ts";

export function register(borrow: Command) {
  borrow
    .command("position")
    .description(
      "Print the position of an account in a market, with interest accrued to the latest block",
    )
    .requiredOption(
      "--market <market>",
      "Market, as <collateral>/<loan> (symbols or addresses) or a market id",
      parseMarket,
    )
    .requiredOption("--account <addr>", "Position owner", parseAddress)
    .action(async function (
      options: { account: Address; market: MarketSelector },
      command: Command,
    ) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const [{ marketId }, block] = await Promise.all([
        resolveMarket({ client, selector: options.market }),
        getBlock(client),
      ]);
      printResult(
        await readPosition({
          account: options.account,
          block,
          client,
          marketId,
        }),
      );
    });
}
