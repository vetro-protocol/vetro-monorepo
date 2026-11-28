import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { getApiPreviewUrl } from "../../scripts/apiPreviewUrl";

const apiPreviewHost = "vetro-api-staging.hemilabs.workers.dev";

const getUrl = (branch: string) =>
  getApiPreviewUrl({ apiPreviewHost, branch, deployEnv: "preview" });

describe("getApiPreviewUrl", function () {
  it("returns the API preview of the branch", function () {
    expect(getUrl("my-branch")).toBe(
      "https://my-branch-vetro-api-staging.hemilabs.workers.dev",
    );
  });

  it("converts the branch name to a preview alias", function () {
    expect(getUrl("bump-@tsconfig/Vite_React.")).toBe(
      "https://bump-tsconfig-vite-react-vetro-api-staging.hemilabs.workers.dev",
    );
  });

  it("keeps a branch name of 8 hex characters", function () {
    expect(getUrl("deadbeef")).toBe(
      "https://deadbeef-vetro-api-staging.hemilabs.workers.dev",
    );
  });

  it("keeps an alias that fits in the DNS label", function () {
    const branch = "a".repeat(45);
    expect(getUrl(branch)).toBe(
      `https://${branch}-vetro-api-staging.hemilabs.workers.dev`,
    );
  });

  it("truncates a long alias and adds a hash of the branch name", function () {
    const branch = `Feature/${"a".repeat(50)}`;
    const hash = createHash("sha256").update(branch).digest("hex").slice(0, 4);
    const url = getUrl(branch);
    expect(url).toBe(
      `https://feature-${"a".repeat(32)}-${hash}-vetro-api-staging.hemilabs.workers.dev`,
    );
    expect(new URL(url!).hostname.split(".")[0]).toHaveLength(63);
  });

  it("matches the alias Cloudflare made for a long branch", function () {
    expect(
      getApiPreviewUrl({
        apiPreviewHost: "vetro-internal-dashboard.hemilabs.workers.dev",
        branch: "target-yield-earn-claim-deposit-actions",
        deployEnv: "preview",
      }),
    ).toBe(
      "https://target-yield-earn-claim-deposit-a-c4e1-vetro-internal-dashboard.hemilabs.workers.dev",
    );
  });

  it("returns undefined when the alias does not start with a letter", function () {
    expect(getUrl("1234-fix")).toBeUndefined();
    expect(getUrl("///")).toBeUndefined();
  });

  it("returns undefined outside the preview build", function () {
    expect(
      getApiPreviewUrl({
        apiPreviewHost,
        branch: "my-branch",
        deployEnv: "staging",
      }),
    ).toBeUndefined();
    expect(
      getApiPreviewUrl({
        apiPreviewHost,
        branch: "my-branch",
        deployEnv: undefined,
      }),
    ).toBeUndefined();
  });

  it("returns undefined without the API preview host", function () {
    expect(
      getApiPreviewUrl({
        apiPreviewHost: undefined,
        branch: "my-branch",
        deployEnv: "preview",
      }),
    ).toBeUndefined();
  });
});
