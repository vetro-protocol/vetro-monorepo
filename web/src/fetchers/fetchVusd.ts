import { getPeggedToken } from "@vetro/gateway/actions";
import type { Address, Client } from "viem";
import { decimals, symbol } from "viem-erc20/actions";

import type { Token } from "../types/index.js";

export const fetchVusd = async function ({
  client,
  gatewayAddress,
}: {
  client: Client;
  gatewayAddress: Address;
}) {
  const peggedTokenAddress = await getPeggedToken(client, {
    address: gatewayAddress,
  });

  const [tokenSymbol, tokenDecimals] = await Promise.all([
    symbol(client, { address: peggedTokenAddress }),
    decimals(client, { address: peggedTokenAddress }),
  ]);

  return {
    address: peggedTokenAddress,
    chainId: client.chain!.id,
    decimals: tokenDecimals,
    symbol: tokenSymbol,
  } as Token;
};
