import { queryOptions } from "@tanstack/react-query";
import { type Address } from "viem";
import { decimals, symbol } from "viem-erc20/actions";

import { client } from "../lib/client";

// On-chain ERC-20 info for a single token, read on demand and cached forever
// (decimals/symbol don't change). Mirrors web's useTokenInfo; used to resolve a
// share token's underlying decimals at pricing time instead of storing them.
const fetchTokenInfo = async function (address: Address) {
  const [tokenDecimals, tokenSymbol] = await Promise.all([
    decimals(client, { address }),
    symbol(client, { address }),
  ]);
  return { address, decimals: tokenDecimals, symbol: tokenSymbol };
};

export const tokenInfoOptions = (address: Address) =>
  queryOptions({
    gcTime: Infinity,
    queryFn: () => fetchTokenInfo(address),
    queryKey: ["token-info", address],
    staleTime: Infinity,
  });
