import { type Command } from "commander";

import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { readMarkets } from "../../../lib/markets.ts";
import { printResult } from "../../../lib/output.ts";

export function register(borrow: Command) {
  borrow
    .command("markets")
    .description("Print the enabled Morpho Blue markets")
    .action(async function (_options: unknown, command: Command) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );

      printResult(await readMarkets(client));
    });
}
