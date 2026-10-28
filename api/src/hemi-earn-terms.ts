import {
  type Address,
  checksumAddress,
  type Hex,
  isAddress,
  isHex,
  size,
  verifyTypedData,
} from "viem";

const chainId = 43111; // Hemi mainnet

const statement =
  "I agree to the Vetro Terms of Use, including the Hemi Earn Terms. Hemi Earn is operated by Vetro Service & Support Corp. My agreement is solely with Vetro. Hemispheres Service & Support (BVI) Ltd., Hemi Labs, Inc. and their affiliates are not parties to it. I am not a U.S. person or otherwise a Restricted Person.";

const domain = {
  chainId,
  name: "Vetro Terms Acceptance",
  version: "1",
} as const;

// The field order is part of the signed type hash. Do not reorder.
const types = {
  TermsAcceptance: [
    { name: "statement", type: "string" },
    { name: "termsUrl", type: "string" },
    { name: "termsHash", type: "bytes32" },
    { name: "termsVersion", type: "string" },
    { name: "account", type: "address" },
    { name: "issuedAt", type: "uint256" },
  ],
} as const;

const maxIssuedAtAgeSeconds = 10 * 60;
const maxIssuedAtFutureSeconds = 60; // Tolerates clock skew

export const minSecondsBetweenAcceptances = 60;

export type TermsAcceptanceRequest = {
  account: Address;
  issuedAt: number;
  signature: Hex;
  termsVersion: string;
};

export type Terms = {
  termsHash: Hex;
  termsUrl: string;
  termsVersion: string;
};

/**
 * Reads the current Terms from the environment, so that Vetro can publish a new
 * version by changing the variables alone. Throws if they are not configured
 * properly, which surfaces as a 500 rather than serving unusable Terms.
 */
export function getCurrentTerms(env: Env): Terms {
  const termsHash = env.HEMI_EARN_TERMS_HASH;
  const termsUrl = env.HEMI_EARN_TERMS_URL;
  const termsVersion = env.HEMI_EARN_TERMS_VERSION;
  if (!termsHash || !isHex(termsHash) || size(termsHash) !== 32) {
    throw new Error("HEMI_EARN_TERMS_HASH must be a 32-byte hex string");
  }
  if (!termsUrl) {
    throw new Error("HEMI_EARN_TERMS_URL must be set");
  }
  if (!termsVersion) {
    throw new Error("HEMI_EARN_TERMS_VERSION must be set");
  }
  return { termsHash, termsUrl, termsVersion };
}

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/**
 * Validates the body of a terms acceptance request. Only the four fields the
 * frontends send are accepted.
 */
export function parseAcceptanceRequest(
  body: unknown,
): TermsAcceptanceRequest | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }
  const { account, issuedAt, signature, termsVersion } = body as Record<
    string,
    unknown
  >;
  if (
    !isNonEmptyString(account) ||
    !isAddress(account, { strict: false }) ||
    !isPositiveInteger(issuedAt) ||
    !isNonEmptyString(signature) ||
    !isHex(signature) ||
    !isNonEmptyString(termsVersion)
  ) {
    return undefined;
  }
  return {
    account: checksumAddress(account),
    issuedAt,
    signature,
    termsVersion,
  };
}

export const isIssuedAtInWindow = ({
  issuedAt,
  now,
}: {
  issuedAt: number;
  now: number;
}) =>
  issuedAt >= now - maxIssuedAtAgeSeconds &&
  issuedAt <= now + maxIssuedAtFutureSeconds;

/**
 * Rebuilds the EIP-712 message from the request and the current Terms, so the
 * signed content never comes from the client.
 */
const buildTypedData = ({
  request: { account, issuedAt },
  terms: { termsHash, termsUrl, termsVersion },
}: {
  request: TermsAcceptanceRequest;
  terms: Terms;
}) => ({
  domain,
  message: {
    account,
    issuedAt: BigInt(issuedAt),
    statement,
    termsHash,
    termsUrl,
    termsVersion,
  },
  primaryType: "TermsAcceptance" as const,
  types,
});

/**
 * Verifies that `account` signed the acceptance of the given Terms. Only
 * regular wallets (EOAs) are supported.
 */
export async function verifyAcceptanceSignature({
  request,
  terms,
}: {
  request: TermsAcceptanceRequest;
  terms: Terms;
}) {
  try {
    return await verifyTypedData({
      ...buildTypedData({ request, terms }),
      address: request.account,
      signature: request.signature,
    });
  } catch {
    return false;
  }
}
