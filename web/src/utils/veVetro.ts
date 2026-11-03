import { knownTokens } from "@vetro-protocol/core";
import { isAddressEqual } from "viem";
import { mainnet } from "viem/chains";

export const vToken = knownTokens.find(
  (token) =>
    token.chainId === mainnet.id &&
    isAddressEqual(token.address, "0xffB0Ea94191d7adcb6606f1b1d0ed1fBff298650"),
)!;
