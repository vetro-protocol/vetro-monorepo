import type { Chain } from "viem";
import { bsc, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { getNativeToken } from "../../src/utils/nativeToken";

describe("getNativeToken", function () {
  it("finds the native token matching the chain id and symbol", function () {
    expect(getNativeToken(mainnet)).toMatchObject({
      chainId: mainnet.id,
      symbol: "ETH",
    });
    expect(getNativeToken(bsc)).toMatchObject({
      chainId: bsc.id,
      symbol: "BNB",
    });
  });

  it("throws when no native token matches the chain", function () {
    const unknownChain = {
      id: 999999,
      nativeCurrency: { decimals: 18, name: "Foo", symbol: "FOO" },
    } as Chain;
    expect(() => getNativeToken(unknownChain)).toThrow(
      "Native token not found for chain 999999",
    );
  });
});
