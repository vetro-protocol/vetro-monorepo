import { type Client } from "viem";
import { previewDeposit } from "viem-erc4626/actions";

import { parseTokenAmount } from "./args.ts";
import { resolveStakablePeggedToken } from "./tokens.ts";

export async function previewStake({
  amount,
  client,
  token,
}: {
  amount: string;
  client: Client;
  token: string;
}) {
  const { decimals, stakingVault } = await resolveStakablePeggedToken({
    client,
    value: token,
  });

  const assets = parseTokenAmount({ amount, decimals, token });

  const shares = await previewDeposit(client, {
    address: stakingVault,
    assets,
  });
  if (shares === 0n) {
    throw new Error(`Amount is too small to stake "${token}": it mints 0`);
  }
  return { assets, shares, stakingVault };
}
