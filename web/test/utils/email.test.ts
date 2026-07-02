import { describe, expect, it } from "vitest";

import { isValidEmail } from "../../src/utils/email";

describe("isValidEmail", function () {
  it("should accept an address with text before and after the @", function () {
    expect(isValidEmail("john@email.com")).toBe(true);
    expect(isValidEmail("a@b")).toBe(true);
  });

  it("should reject an empty string", function () {
    expect(isValidEmail("")).toBe(false);
  });

  it("should reject a value without an @", function () {
    expect(isValidEmail("john.email.com")).toBe(false);
  });

  it("should reject a value missing the local or domain part", function () {
    expect(isValidEmail("@email.com")).toBe(false);
    expect(isValidEmail("john@")).toBe(false);
  });
});
