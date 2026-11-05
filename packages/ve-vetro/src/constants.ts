import { knownTokens } from "@vetro-protocol/core";
import { type Address, parseUnits } from "viem";
import { mainnet } from "viem/chains";

const vToken = knownTokens.find(
  (token) => token.chainId === mainnet.id && token.symbol === "V",
)!;

export const minClaimAmount = parseUnits("10", vToken.decimals);

export const veHemiAddress: Address =
  "0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89";

export const veHemiSnapshotBlock = 5_592_174n;
