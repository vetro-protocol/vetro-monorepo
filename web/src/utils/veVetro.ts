import { knownTokens } from "@vetro-protocol/core";
import { type Address, parseUnits } from "viem";
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

// The distributor's `MIN_TARGET_LOCK_AMOUNT`: a claim below it reverts.
// TODO: export it from `@vetro-protocol/ve-vetro` and import it from there.
export const minClaimAmount = parseUnits("10", vToken.decimals);

function getAmountBlocker(amount: bigint | undefined) {
  if (amount === undefined) {
    return "loading";
  }
  if (amount === 0n) {
    return "nothing-to-claim";
  }
  if (amount < minClaimAmount) {
    return "below-minimum";
  }
  return undefined;
}

export function getClaimBlocker({
  amount,
  hasClaimEnded,
  isClaimEndError,
  isClaimOpen,
}: {
  amount: bigint | undefined;
  hasClaimEnded: boolean | undefined;
  isClaimEndError: boolean;
  isClaimOpen: boolean | undefined;
}) {
  if (isClaimOpen === false || hasClaimEnded === true) {
    return "not-open";
  }
  if (hasClaimEnded === undefined && isClaimEndError) {
    return "claim-end-error";
  }
  const amountBlocker = getAmountBlocker(amount);
  if (amountBlocker) {
    return amountBlocker;
  }
  if (hasClaimEnded === undefined || isClaimOpen === undefined) {
    return "loading";
  }
  return undefined;
}
