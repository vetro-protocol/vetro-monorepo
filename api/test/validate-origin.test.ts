import { describe, expect, it } from "vitest";

import { createOriginFn, parseOrigins } from "../src/validate-origin.ts";

describe("parseOrigins", function () {
  it("keeps literal origins as strings and converts globs to RegExp", function () {
    const [literal, glob] = parseOrigins("https://a.com,https://*.b.com");
    expect(literal).toBe("https://a.com");
    expect(glob).toBeInstanceOf(RegExp);
  });
});

describe("createOriginFn", function () {
  const isAllowed = createOriginFn(
    parseOrigins("https://a.com,https://*.b.com"),
  );

  it("returns the origin on a literal match", function () {
    expect(isAllowed("https://a.com")).toBe("https://a.com");
  });

  it("returns the origin on a glob match", function () {
    expect(isAllowed("https://app.b.com")).toBe("https://app.b.com");
  });

  it("returns null when no allowed origin matches", function () {
    expect(isAllowed("https://evil.com")).toBeNull();
  });
});
