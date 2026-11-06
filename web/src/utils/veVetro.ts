import { knownTokens } from "@vetro-protocol/core";
import {
  minClaimAmount,
  veVetroContractsByChain,
} from "@vetro-protocol/ve-vetro";
import { hemi, hemiSepolia } from "hemi-viem";
import { veVetroChain } from "networks";
import { mainnet } from "viem/chains";

export const hemiToken = knownTokens.find(
  (token) => token.chainId === hemi.id && token.symbol === "HEMI",
)!;

export const veVetroContracts = veVetroContractsByChain[veVetroChain.id];

// The terms must hash to the distributor's `config().termsHash`, or the claim
// reverts with `InvalidTermsSignature`.
const veVetroTermsByChain = {
  // TODO: check against the mainnet distributor's `config().termsHash` once
  // it is deployed.
  [hemi.id]:
    "I agree to the Vetro Terms of Use (version dated November 5 2026), including Section 18 (veVETRO Claim). I confirm that I am not a Restricted Person for the veVETRO Claim and do not reside in, and am not a citizen of, located in, or incorporated or organised in, the United States, the European Economic Area, Canada, the United Kingdom, or any Prohibited Jurisdiction.",
  [hemiSepolia.id]:
    "I agree to the Test Token Terms of Use (version dated November 5 2026), including Section X (veTEST Claim). I confirm that I am not a Restricted Person for the veTEST Claim and do not reside in, and am not a citizen of, located in, or incorporated or organised in, the United States, the European Economic Area, Canada, the United Kingdom, or any Prohibited Jurisdiction.",
};

export const veVetroTerms = veVetroTermsByChain[veVetroChain.id];

export const vToken =
  veVetroChain.id === hemiSepolia.id
    ? knownTokens.find(
        (token) => token.chainId === hemiSepolia.id && token.symbol === "TT",
      )!
    : knownTokens.find(
        (token) => token.chainId === mainnet.id && token.symbol === "V",
      )!;

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
