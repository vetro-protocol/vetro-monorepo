import type { Address, Client } from "viem";
import { decimals, symbol } from "viem-erc20/actions";

export async function fetchSvusd({
  client,
  stakingVaultAddress,
}: {
  client: Client;
  stakingVaultAddress: Address;
}) {
  const [tokenDecimals, tokenSymbol] = await Promise.all([
    decimals(client, { address: stakingVaultAddress }),
    symbol(client, { address: stakingVaultAddress }),
  ]);

  return {
    address: stakingVaultAddress,
    chainId: client.chain!.id,
    decimals: tokenDecimals,
    symbol: tokenSymbol,
  };
}
