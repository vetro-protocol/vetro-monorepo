import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";

import {
  getCurrentTerms,
  isIssuedAtInWindow,
  parseAcceptanceRequest,
  type Terms,
  verifyAcceptanceSignature,
} from "../src/hemi-earn-terms.ts";

const terms = {
  termsHash:
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  termsUrl: "https://vetro.org/terms-of-use",
  termsVersion: "1",
} as const;

// Written out as in the specification instead of reusing the production
// builder, so a mistake in it can't go unnoticed.
const signTerms = ({
  account,
  issuedAt,
  overrides = {},
}: {
  account: ReturnType<typeof privateKeyToAccount>;
  issuedAt: number;
  overrides?: Partial<Terms>;
}) =>
  account.signTypedData({
    domain: { chainId: 43111, name: "Vetro Terms Acceptance", version: "1" },
    message: {
      account: account.address,
      issuedAt: BigInt(issuedAt),
      statement:
        "I agree to the Vetro Terms of Use, including the Hemi Earn Terms. Hemi Earn is operated by Vetro Service & Support Corp. My agreement is solely with Vetro. Hemispheres Service & Support (BVI) Ltd., Hemi Labs, Inc. and their affiliates are not parties to it. I am not a U.S. person or otherwise a Restricted Person.",
      ...terms,
      ...overrides,
    },
    primaryType: "TermsAcceptance",
    types: {
      TermsAcceptance: [
        { name: "statement", type: "string" },
        { name: "termsUrl", type: "string" },
        { name: "termsHash", type: "bytes32" },
        { name: "termsVersion", type: "string" },
        { name: "account", type: "address" },
        { name: "issuedAt", type: "uint256" },
      ],
    },
  });

describe("verifyAcceptanceSignature", function () {
  const account = privateKeyToAccount(generatePrivateKey());
  const issuedAt = 1798000000;

  it("should accept a signature of the current terms by the account", async function () {
    const signature = await signTerms({ account, issuedAt });

    const valid = await verifyAcceptanceSignature({
      request: {
        account: account.address,
        issuedAt,
        signature,
        termsVersion: terms.termsVersion,
      },
      terms,
    });

    expect(valid).toBe(true);
  });

  it("should reject a signature by another account", async function () {
    const other = privateKeyToAccount(generatePrivateKey());
    const signature = await signTerms({ account: other, issuedAt });

    const valid = await verifyAcceptanceSignature({
      request: {
        account: account.address,
        issuedAt,
        signature,
        termsVersion: terms.termsVersion,
      },
      terms,
    });

    expect(valid).toBe(false);
  });

  it("should reject a signature of different terms", async function () {
    const signature = await signTerms({
      account,
      issuedAt,
      overrides: { termsUrl: "https://example.com/other-terms" },
    });

    const valid = await verifyAcceptanceSignature({
      request: {
        account: account.address,
        issuedAt,
        signature,
        termsVersion: terms.termsVersion,
      },
      terms,
    });

    expect(valid).toBe(false);
  });

  it("should reject a signature of a different issuedAt", async function () {
    const signature = await signTerms({ account, issuedAt });

    const valid = await verifyAcceptanceSignature({
      request: {
        account: account.address,
        issuedAt: issuedAt + 1,
        signature,
        termsVersion: terms.termsVersion,
      },
      terms,
    });

    expect(valid).toBe(false);
  });

  it("should reject a malformed signature", async function () {
    const valid = await verifyAcceptanceSignature({
      request: {
        account: account.address,
        issuedAt,
        signature: "0x1234",
        termsVersion: terms.termsVersion,
      },
      terms,
    });

    expect(valid).toBe(false);
  });
});

describe("isIssuedAtInWindow", function () {
  const now = 1798000000;

  it.each([
    ["now", now, true],
    ["10 minutes ago", now - 600, true],
    ["more than 10 minutes ago", now - 601, false],
    ["1 minute ahead", now + 60, true],
    ["more than 1 minute ahead", now + 61, false],
  ])("should handle %s", function (_, issuedAt, expected) {
    expect(isIssuedAtInWindow({ issuedAt, now })).toBe(expected);
  });
});

describe("parseAcceptanceRequest", function () {
  const valid = {
    account: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    issuedAt: 1798000000,
    signature: "0x1234",
    termsVersion: "1",
  };

  it("should checksum the account", function () {
    expect(parseAcceptanceRequest(valid)).toEqual({
      ...valid,
      account: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    });
  });

  it.each([
    ["null body", null],
    ["a non-address account", { ...valid, account: "0x123" }],
    ["a missing account", { ...valid, account: undefined }],
    ["a string issuedAt", { ...valid, issuedAt: "1798000000" }],
    ["a fractional issuedAt", { ...valid, issuedAt: 1798000000.5 }],
    ["a non-positive issuedAt", { ...valid, issuedAt: 0 }],
    ["a non-hex signature", { ...valid, signature: "signature" }],
    ["a numeric termsVersion", { ...valid, termsVersion: 1 }],
    ["an empty termsVersion", { ...valid, termsVersion: "" }],
  ])("should reject %s", function (_, body) {
    expect(parseAcceptanceRequest(body)).toBeUndefined();
  });
});

describe("getCurrentTerms", function () {
  const env = {
    HEMI_EARN_TERMS_HASH: terms.termsHash,
    HEMI_EARN_TERMS_URL: terms.termsUrl,
    HEMI_EARN_TERMS_VERSION: terms.termsVersion,
  } as Env;

  it("should read the terms from the environment", function () {
    expect(getCurrentTerms(env)).toEqual(terms);
  });

  it.each([
    ["a missing hash", { HEMI_EARN_TERMS_HASH: "" }],
    ["a hash of the wrong size", { HEMI_EARN_TERMS_HASH: "0x1234" }],
    ["a missing url", { HEMI_EARN_TERMS_URL: "" }],
    ["a missing version", { HEMI_EARN_TERMS_VERSION: "" }],
  ])("should throw on %s", function (_, overrides) {
    expect(() => getCurrentTerms({ ...env, ...overrides })).toThrow();
  });
});
