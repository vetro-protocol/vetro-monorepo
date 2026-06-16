import { describe, expect, it } from "vitest";

import { queryStringObjectToString } from "../src/querystring-object-to-string.ts";

describe("queryStringObjectToString", function () {
  it("returns an empty string when no params are given", function () {
    expect(queryStringObjectToString()).toBe("");
  });

  it("returns an empty string for an empty object", function () {
    expect(queryStringObjectToString({})).toBe("");
  });

  it("prefixes a single param with a question mark", function () {
    expect(queryStringObjectToString({ a: "1" })).toBe("?a=1");
  });

  it("joins multiple params with ampersands", function () {
    expect(queryStringObjectToString({ a: "1", b: "2" })).toBe("?a=1&b=2");
  });
});
