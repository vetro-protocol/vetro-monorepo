import {
  marketIds,
  morphoBlueAddress,
} from "@vetro-protocol/morpho-blue-market";
import { getMarketParams } from "@vetro-protocol/morpho-blue-market/actions";
import { type Command } from "commander";
import { isAddressEqual, zeroAddress } from "viem";

import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printResult } from "../../../lib/output.ts";
import { readToken } from "../../../lib/tokens.ts";

export function register(borrow: Command) {
  borrow
    .command("markets")
    .description("Print the enabled Morpho Blue markets")
    .action(async function (_options: unknown, command: Command) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );

      const markets = await Promise.all(
        marketIds.map(async function (marketId) {
          const { collateralToken, irm, lltv, loanToken, oracle } =
            await getMarketParams({
              address: morphoBlueAddress,
              client,
              marketId,
            });
          if (isAddressEqual(loanToken, zeroAddress)) {
            throw new Error(
              `Unknown market "${marketId}": Morpho Blue has no market with this id`,
            );
          }
          const [collateral, loan] = await Promise.all([
            readToken({ address: collateralToken, client }),
            readToken({ address: loanToken, client }),
          ]);
          return {
            collateralToken: collateral,
            irm,
            lltv,
            loanToken: loan,
            marketId,
            oracle,
            pair: `${collateral.symbol}/${loan.symbol}`,
          };
        }),
      );
      printResult(markets);
    });
}
