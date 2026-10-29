-- Only the latest accepted version of each account is kept.
CREATE TABLE hemi_earn_terms_acceptance (
  account TEXT PRIMARY KEY NOT NULL,
  issued_at INTEGER NOT NULL,
  signature TEXT NOT NULL,
  statement_hash TEXT NOT NULL,
  terms_hash TEXT NOT NULL,
  terms_url TEXT NOT NULL,
  terms_version TEXT NOT NULL,
  updated_at INTEGER NOT NULL
) WITHOUT ROWID;
