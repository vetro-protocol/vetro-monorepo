import { readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { keccak256, toBytes } from "viem";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getAcceptance,
  saveAcceptance,
} from "../src/terms-acceptance-store.ts";

// The least of D1's API the store uses, backed by an in-memory SQLite that
// runs the real migration.
function createDb() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(
    readFileSync(
      path.join(
        import.meta.dirname,
        "../migrations/0001_create_hemi_earn_terms_acceptance.sql",
      ),
      "utf8",
    ),
  );
  return {
    prepare: (sql: string) => ({
      bind: (...params: (number | string)[]) => ({
        first: async () => sqlite.prepare(sql).get(...params) ?? null,
        run: async () => sqlite.prepare(sql).run(...params),
      }),
    }),
    sqlite,
  };
}

const account = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;

const acceptanceOf = ({
  issuedAt,
  termsVersion,
}: {
  issuedAt: number;
  termsVersion: string;
}) => ({
  request: {
    account,
    issuedAt,
    signature: `0x${termsVersion}` as const,
    termsVersion,
  },
  terms: {
    termsHash: `0x${"1".repeat(64)}` as const,
    termsUrl: "https://vetro.org/terms-of-use",
    termsVersion,
  },
});

describe("terms acceptance store", function () {
  let db: ReturnType<typeof createDb>;

  beforeEach(function () {
    db = createDb();
  });

  const asD1 = () => db as unknown as D1Database;

  it("should have no acceptance for an unknown account", async function () {
    expect(await getAcceptance({ account, db: asD1() })).toBeUndefined();
  });

  it("should return the stored version", async function () {
    await saveAcceptance({
      db: asD1(),
      now: 1000,
      ...acceptanceOf({ issuedAt: 990, termsVersion: "1" }),
    });

    expect(await getAcceptance({ account, db: asD1() })).toEqual({
      termsVersion: "1",
    });
  });

  it("should store the hash of the signed statement", async function () {
    await saveAcceptance({
      db: asD1(),
      now: 1000,
      ...acceptanceOf({ issuedAt: 990, termsVersion: "1" }),
    });

    expect(
      db.sqlite
        .prepare(
          "SELECT statement_hash AS statementHash FROM hemi_earn_terms_acceptance",
        )
        .all(),
    ).toEqual([
      {
        statementHash: keccak256(
          toBytes(
            "I agree to the Vetro Terms of Use, including the Hemi Earn Terms. Hemi Earn is operated by Vetro Service & Support Corp. My agreement is solely with Vetro. Hemispheres Service & Support (BVI) Ltd., Hemi Labs, Inc. and their affiliates are not parties to it. I am not a U.S. person or otherwise a Restricted Person.",
          ),
        ),
      },
    ]);
  });

  it("should keep the original record when the same version is saved again", async function () {
    await saveAcceptance({
      db: asD1(),
      now: 1000,
      ...acceptanceOf({ issuedAt: 990, termsVersion: "1" }),
    });
    await saveAcceptance({
      db: asD1(),
      now: 2000,
      ...acceptanceOf({ issuedAt: 1990, termsVersion: "1" }),
    });

    expect(
      db.sqlite
        .prepare(
          "SELECT issued_at AS issuedAt, updated_at AS updatedAt FROM hemi_earn_terms_acceptance",
        )
        .all(),
    ).toMatchObject([{ issuedAt: 990, updatedAt: 1000 }]);
  });

  it("should replace the record when a new version is saved", async function () {
    await saveAcceptance({
      db: asD1(),
      now: 1000,
      ...acceptanceOf({ issuedAt: 990, termsVersion: "1" }),
    });
    await saveAcceptance({
      db: asD1(),
      now: 2000,
      ...acceptanceOf({ issuedAt: 1990, termsVersion: "2" }),
    });

    expect(
      db.sqlite
        .prepare(
          "SELECT issued_at AS issuedAt, signature, terms_version AS termsVersion, updated_at AS updatedAt FROM hemi_earn_terms_acceptance",
        )
        .all(),
    ).toMatchObject([
      {
        issuedAt: 1990,
        signature: "0x2",
        termsVersion: "2",
        updatedAt: 2000,
      },
    ]);
  });
});
