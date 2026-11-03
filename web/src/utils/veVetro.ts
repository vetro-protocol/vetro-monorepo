import { knownTokens } from "@vetro-protocol/core";
import { mainnet } from "viem/chains";

export const vToken = knownTokens.find(
  (token) => token.chainId === mainnet.id && token.symbol === "V",
)!;
