import { hemi } from "viem/chains";
import { describe, expect, it } from "vitest";

import { getChainById } from "../../src/networks";

describe("getChainById", function () {
  it("returns the chain when chainId exists in allChains", function () {
    const result = getChainById(hemi.id);
    expect(result).toBe(hemi);
  });

  it("throws when chainId is not found", function () {
    expect(() => getChainById(999_999)).toThrow(
      "Chain with id 999999 not found",
    );
  });
});
