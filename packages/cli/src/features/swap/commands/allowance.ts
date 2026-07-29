import { type Command } from "commander";
import { type Address, formatUnits } from "viem";
import { allowance } from "viem-erc20/actions";

import { parseAddress } from "../../../lib/args.js";
import { createVetroClient } from "../../../lib/client.js";
import { printResult } from "../../../lib/output.js";
import { resolveSwapToken } from "../../../lib/tokens.js";

export function register(swap: Command) {
  swap
    .command("allowance")
    .description("Print how much of a token the gateway is allowed to spend")
    .requiredOption(
      "--token <token>",
      "Whitelisted or pegged token to check, by symbol or address",
    )
    .requiredOption("--account <addr>", "Token owner", parseAddress)
    .action(async function (options: { account: Address; token: string }) {
      const client = createVetroClient();
      const token = await resolveSwapToken({
        client,
        value: options.token,
      });
      const approved = await allowance(client, {
        address: token.address,
        owner: options.account,
        spender: token.gatewayAddress,
      });
      printResult(formatUnits(approved, token.decimals));
    });
}
