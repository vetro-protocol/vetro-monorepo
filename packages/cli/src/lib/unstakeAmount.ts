import { type Command, Option } from "commander";
import { type Address, type Client } from "viem";

import { parseAmount } from "./args.ts";
import { getGatewayPeggedToken, readToken } from "./tokens.ts";

export const addUnstakeAmountOptions = (command: Command) =>
  command
    .addOption(
      new Option(
        "--amount <n>",
        "Pegged token amount in human units; one of --amount or --shares is required",
      )
        .argParser(parseAmount)
        .conflicts("shares"),
    )
    .option(
      "--shares <n>",
      "Share token amount in human units; one of --amount or --shares is required",
      parseAmount,
    );

export function getUnstakeAmount({
  command,
  options,
}: {
  command: Command;
  options: { amount?: string; shares?: string };
}) {
  const amount = options.amount ?? options.shares;
  if (amount === undefined) {
    return command.error(
      "error: one of '--amount <n>' or '--shares <n>' is required",
    );
  }
  return { amount, inShares: options.shares !== undefined };
}

export const readSpentToken = ({
  client,
  gatewayAddress,
  inShares,
  stakingVault,
}: {
  client: Client;
  gatewayAddress: Address;
  inShares: boolean;
  stakingVault: Address;
}) =>
  inShares
    ? readToken({ address: stakingVault, client })
    : getGatewayPeggedToken({ client, gatewayAddress });
