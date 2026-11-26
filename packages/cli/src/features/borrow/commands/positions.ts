import { marketIds } from "@vetro-protocol/morpho-blue-market";
import { type Command } from "commander";
import { type Address } from "viem";
import { getBlock } from "viem/actions";

import { parseAddress } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printResult } from "../../../lib/output.ts";
import { readPosition } from "../../../lib/positions.ts";

export function register(borrow: Command) {
  borrow
    .command("positions")
    .description(
      "Print the position of an account in each enabled market where it has collateral or debt, with interest accrued to the latest block",
    )
    .requiredOption("--account <addr>", "Position owner", parseAddress)
    .action(async function (options: { account: Address }, command: Command) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const block = await getBlock(client);
      const positions = await Promise.all(
        marketIds.map((marketId) =>
          readPosition({
            account: options.account,
            block,
            client,
            marketId,
          }),
        ),
      );
      printResult(
        positions.filter(
          (position) => position.collateral > 0n || position.borrowAssets > 0n,
        ),
      );
    });
}
