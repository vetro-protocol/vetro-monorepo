import type { Address } from "viem";

import type { Terms, TermsAcceptanceRequest } from "./hemi-earn-terms.ts";

export async function getAcceptance({
  account,
  db,
}: {
  account: Address;
  db: D1Database;
}) {
  const row = await db
    .prepare(
      "SELECT terms_version, updated_at FROM hemi_earn_terms_acceptance WHERE account = ?",
    )
    .bind(account)
    .first<{ terms_version: string; updated_at: number }>();
  return row
    ? { termsVersion: row.terms_version, updatedAt: row.updated_at }
    : undefined;
}

// Replaces the account's record only when the version differs, so repeating an
// acceptance of the same version keeps the original record.
export async function saveAcceptance({
  db,
  now,
  request: { account, issuedAt, signature },
  terms: { termsHash, termsUrl, termsVersion },
}: {
  db: D1Database;
  now: number;
  request: TermsAcceptanceRequest;
  terms: Terms;
}) {
  await db
    .prepare(
      `INSERT INTO hemi_earn_terms_acceptance
        (account, issued_at, signature, terms_hash, terms_url, terms_version, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (account) DO UPDATE SET
        issued_at = excluded.issued_at,
        signature = excluded.signature,
        terms_hash = excluded.terms_hash,
        terms_url = excluded.terms_url,
        terms_version = excluded.terms_version,
        updated_at = excluded.updated_at
      WHERE terms_version <> excluded.terms_version`,
    )
    .bind(account, issuedAt, signature, termsHash, termsUrl, termsVersion, now)
    .run();
}
