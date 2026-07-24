import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deriveApiOrigin,
  isRelativeUrl,
  isValidUrl,
} from "../../src/utils/url";

describe("isRelativeUrl", function () {
  it("should return true for relative URLs starting with /", function () {
    expect(isRelativeUrl("/path/to/resource")).toBe(true);
  });

  it("should return false for absolute URLs", function () {
    expect(isRelativeUrl("https://example.com/path")).toBe(false);
  });
});

describe("isValidUrl", function () {
  it("should return true for valid https URL", function () {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("should return true for valid http URL", function () {
    expect(isValidUrl("http://localhost:3000")).toBe(true);
  });

  it("should return true for URL with path", function () {
    expect(isValidUrl("https://api.example.com/v1/endpoint")).toBe(true);
  });

  it("should return false for invalid URL", function () {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("should return false for empty string", function () {
    expect(isValidUrl("")).toBe(false);
  });

  it("should return false for relative path", function () {
    expect(isValidUrl("/api/endpoint")).toBe(false);
  });
});

describe("deriveApiOrigin", function () {
  // Derivation is hard-gated to the preview build.
  beforeEach(function () {
    vi.stubEnv("VITE_DEPLOY_ENV", "preview");
    vi.stubEnv(
      "VITE_STAGING_WEB_PREVIEW_HOST",
      "vetro-web-staging.hemilabs.workers.dev",
    );
    vi.stubEnv(
      "VITE_STAGING_API_PREVIEW_HOST",
      "vetro-api-staging.hemilabs.workers.dev",
    );
  });

  afterEach(function () {
    vi.unstubAllEnvs();
  });

  it("derives the matching API preview from a branch preview host", function () {
    expect(
      deriveApiOrigin("my-branch-vetro-web-staging.hemilabs.workers.dev"),
    ).toBe("https://my-branch-vetro-api-staging.hemilabs.workers.dev");
  });

  it("supports truncated branch aliases with a hash", function () {
    expect(
      deriveApiOrigin("long--a1b2c3-vetro-web-staging.hemilabs.workers.dev"),
    ).toBe("https://long--a1b2c3-vetro-api-staging.hemilabs.workers.dev");
  });

  it("returns undefined for a versioned/commit preview prefix", function () {
    expect(
      deriveApiOrigin("9f3ac2b1-vetro-web-staging.hemilabs.workers.dev"),
    ).toBeUndefined();
  });

  it("returns undefined for the stable staging host (no alias prefix)", function () {
    expect(
      deriveApiOrigin("vetro-web-staging.hemilabs.workers.dev"),
    ).toBeUndefined();
  });

  it("returns undefined for custom domains", function () {
    expect(deriveApiOrigin("app.vetro.org")).toBeUndefined();
    expect(deriveApiOrigin("staging.letshamsterdance.xyz")).toBeUndefined();
  });

  it("returns undefined for localhost", function () {
    expect(deriveApiOrigin("localhost")).toBeUndefined();
  });

  it("only matches the anchored web-staging worker name", function () {
    expect(
      deriveApiOrigin("vetro-web-staging.hemilabs.workers.dev.evil.com"),
    ).toBeUndefined();
    expect(
      deriveApiOrigin("evil-vetro-api-staging.hemilabs.workers.dev"),
    ).toBeUndefined();
  });

  it("never derives outside the preview build", function () {
    const previewHost = "my-branch-vetro-web-staging.hemilabs.workers.dev";
    vi.stubEnv("VITE_DEPLOY_ENV", "production");
    expect(deriveApiOrigin(previewHost)).toBeUndefined();
    vi.stubEnv("VITE_DEPLOY_ENV", "staging");
    expect(deriveApiOrigin(previewHost)).toBeUndefined();
    vi.stubEnv("VITE_DEPLOY_ENV", "");
    expect(deriveApiOrigin(previewHost)).toBeUndefined();
  });
});
