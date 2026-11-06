import { knownTokens } from "@vetro-protocol/core";
import {
  minClaimAmount,
  veVetroContractsByChain,
} from "@vetro-protocol/ve-vetro";
import { hemi, hemiSepolia } from "hemi-viem";
import { veVetroChain } from "networks";
import {
  isAddressEqual,
  parseAbiItem,
  parseEventLogs,
  type TransactionReceipt,
} from "viem";
import { mainnet } from "viem/chains";

export const hemiToken = knownTokens.find(
  (token) => token.chainId === hemi.id && token.symbol === "HEMI",
)!;

export const veVetroContracts = veVetroContractsByChain[veVetroChain.id];

export const veVetroToken = knownTokens.find(
  (token) =>
    token.chainId === veVetroChain.id &&
    isAddressEqual(token.address, veVetroContracts.veVetro),
);

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

export function getClaimBlocker({
  amount,
  hasClaimEnded,
  isClaimOpen,
}: {
  amount: bigint;
  hasClaimEnded: boolean;
  isClaimOpen: boolean;
}) {
  if (!isClaimOpen || hasClaimEnded) {
    return "not-open";
  }
  if (amount === 0n) {
    return "nothing-to-claim";
  }
  if (amount < minClaimAmount) {
    return "below-minimum";
  }
  return undefined;
}

type VeVetroPosition = {
  amount: bigint;
  tokenId: bigint;
  unlockTime: number;
};

const depositEvent = parseAbiItem(
  "event Deposit(address indexed provider, uint256 indexed tokenId, uint256 amount, uint256 lockTime, uint256 timestamp)",
);

// veVETRO's Deposit has the absolute lock end in `lockTime`.
export const getClaimedPositions = (receipt: TransactionReceipt) =>
  parseEventLogs({ abi: [depositEvent], logs: receipt.logs })
    .filter(({ address }) => isAddressEqual(address, veVetroContracts.veVetro))
    .map(({ args }) => ({
      amount: args.amount,
      tokenId: args.tokenId,
      unlockTime: Number(args.lockTime),
    }));

// A claim always mints a new position. The list can already have it when a
// refetch got the indexed claim before the receipt.
export const addClaimedPositions = ({
  claimedPositions,
  positions,
}: {
  claimedPositions: VeVetroPosition[];
  positions: VeVetroPosition[];
}) =>
  claimedPositions.reduce(
    (result, claimed) =>
      result.some(({ tokenId }) => tokenId === claimed.tokenId)
        ? result
        : [claimed, ...result],
    positions,
  );
