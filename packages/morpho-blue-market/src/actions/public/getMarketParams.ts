import { type Address, type Client, type Hash, zeroHash } from "viem";
import { readContract } from "viem/actions";

import { morphoBlueAbi } from "../../abi/morphoBlueAbi.js";
import type { MarketParams } from "../../types.js";
import { isAddressValid } from "../../utils/isAddressValid.js";

export const getMarketParams = async function ({
  address,
  client,
  marketId,
}: {
  address: Address;
  client: Client;
  marketId: Hash;
}): Promise<MarketParams> {
  // Validate client
  if (!client) {
    throw new Error("Client is not defined");
  }

  // Validate Morpho address
  if (!isAddressValid(address)) {
    throw new Error("Invalid Morpho address");
  }

  // Validate market ID
  if (!marketId || marketId === zeroHash) {
    throw new Error("Market ID cannot be empty or zero");
  }

  const [loanToken, collateralToken, oracle, irm, lltv] = await readContract(
    client,
    {
      abi: morphoBlueAbi,
      address,
      args: [marketId],
      functionName: "idToMarketParams",
    },
  );

  return { collateralToken, irm, lltv, loanToken, oracle };
};
