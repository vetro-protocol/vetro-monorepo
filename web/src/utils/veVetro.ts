import { knownTokens } from "@vetro-protocol/core";
import type { Address } from "viem";
import { hemi, mainnet } from "viem/chains";

export const hemiToken = knownTokens.find(
  (token) => token.chainId === hemi.id && token.symbol === "HEMI",
)!;

// Placeholders until the ve-vetro package (#1062) is merged. Replace with
// the `veHemiAddress` and `veHemiSnapshotBlock` exports of
// `@vetro-protocol/ve-vetro`.
export const veHemiAddress: Address =
  "0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89";

export const veHemiSnapshotBlock = 5_592_174n;

export const vToken = knownTokens.find(
  (token) => token.chainId === mainnet.id && token.symbol === "V",
)!;
