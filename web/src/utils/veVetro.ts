import { knownTokens } from "@vetro-protocol/core";
import { type Address, parseUnits, zeroAddress } from "viem";
import { hemi, hemiSepolia, mainnet } from "viem/chains";

export const hemiToken = knownTokens.find(
  (token) => token.chainId === hemi.id && token.symbol === "HEMI",
)!;

// Placeholders until the ve-vetro package (#1062) is merged. Replace with
// the `veHemiAddress` and `veHemiSnapshotBlock` exports of
// `@vetro-protocol/ve-vetro`.
export const veHemiAddress: Address =
  "0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89";

export const veHemiSnapshotBlock = 5_592_174n;

// Placeholders until the distributor is deployed and its terms are published.
// The terms must hash to the distributor's `config().termsHash`, or the claim
// reverts with `InvalidTermsSignature`.
export const veVetroDistributorAddress: Address = zeroAddress;

// TODO: use `hemi` instead of `hemiSepolia` before release.
export const veVetroChain = hemiSepolia;

// TODO real date needs to be defined
const termsDate = "November 4, 2026";

export const veVetroTerms = `I agree to the Vetro Terms of Use (version dated ${termsDate}), including Section 18 (veVETRO Claim). I confirm that I am not a Restricted Person for the veVETRO Claim and that I do not reside in, and I am not a citizen of, located in, or incorporated or organised in, the United States, the European Economic Area, Canada, the United Kingdom, or any Prohibited Jurisdiction.`;

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
  isAmountError,
  isClaimEndError,
  isClaimOpen,
  isClaimOpenError,
}: {
  amount: bigint | undefined;
  hasClaimEnded: boolean | undefined;
  isAmountError: boolean;
  isClaimEndError: boolean;
  isClaimOpen: boolean | undefined;
  isClaimOpenError: boolean;
}) {
  if (isClaimOpen === false || hasClaimEnded === true) {
    return "not-open";
  }
  const hasLoadError = [
    { data: amount, isError: isAmountError },
    { data: hasClaimEnded, isError: isClaimEndError },
    { data: isClaimOpen, isError: isClaimOpenError },
  ].some(({ data, isError }) => data === undefined && isError);
  if (hasLoadError) {
    return "load-error";
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
