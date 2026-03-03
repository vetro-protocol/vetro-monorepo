import type { Token } from "types";
import { type Address, type Client, isAddressEqual } from "viem";
import { decimals, name, symbol } from "viem-erc20/actions";

import { knownTokens } from "../utils/tokenList";

export const fetchTokenInfo = async function ({
  address,
  client,
}: {
  address: Address;
  client: Client;
}): Promise<Token> {
  const chainId = client.chain!.id;

  const known = knownTokens.find(
    (t) => isAddressEqual(t.address, address) && t.chainId === chainId,
  );
  if (known) {
    return known;
  }

  const [tokenDecimals, tokenName, tokenSymbol] = await Promise.all([
    decimals(client, { address }),
    name(client, { address }),
    symbol(client, { address }),
  ]);

  return {
    address,
    chainId,
    decimals: tokenDecimals,
    logoURI: "",
    name: tokenName,
    symbol: tokenSymbol,
  };
};
