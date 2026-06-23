import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { updateRpcUrls } from "../src/update-rpc-urls.ts";

describe("update-rpc-urls", function () {
  describe("updateRpcUrls", function () {
    it("should return the original chain when rpcUrlEnv is undefined", function () {
      const result = updateRpcUrls(mainnet);
      expect(result).toBe(mainnet);
    });

    it("should return the original chain when rpcUrlEnv is not a string", function () {
      // @ts-expect-error testing invalid input
      const result = updateRpcUrls(mainnet, null);
      expect(result).toBe(mainnet);
    });

    it("should return the original chain when rpcUrlEnv contains no valid URLs", function () {
      const result = updateRpcUrls(mainnet, "invalid+also-invalid");
      expect(result).toBe(mainnet);
    });

    it("should update RPC URLs with valid URLs from environment string", function () {
      const rpcUrlEnv =
        "https://ethereum-rpc.publicnode.com+https://1rpc.io/eth";
      const result = updateRpcUrls(mainnet, rpcUrlEnv);

      // Assert on the rpcUrls we care about rather than deep-equaling the whole
      // chain: viem's defineChain attaches a fresh `extend` method, so a full
      // toEqual against `{ ...mainnet }` would fail on the function reference.
      expect(result).not.toBe(mainnet);
      expect(result.rpcUrls.default.http).toEqual([
        "https://ethereum-rpc.publicnode.com",
        "https://1rpc.io/eth",
      ]);

      // Verify original RPC URLs are not kept
      mainnet.rpcUrls.default.http.forEach((originalUrl) =>
        expect(result.rpcUrls.default.http).not.toContain(originalUrl),
      );
    });

    it("should filter out invalid URLs while keeping valid ones", function () {
      const rpcUrlEnv = "https://eth.drpc.org+invalid-url+https://1rpc.io/eth";
      const result = updateRpcUrls(mainnet, rpcUrlEnv);

      expect(result).not.toBe(mainnet);
      expect(result.rpcUrls.default.http).toEqual([
        "https://eth.drpc.org",
        "https://1rpc.io/eth",
      ]);
    });

    it("should handle single valid URL", function () {
      const rpcUrlEnv = "https://eth.drpc.org";
      const result = updateRpcUrls(mainnet, rpcUrlEnv);

      expect(result).not.toBe(mainnet);
      expect(result.rpcUrls.default.http).toEqual(["https://eth.drpc.org"]);
    });

    it("should handle empty string", function () {
      const result = updateRpcUrls(mainnet, "");
      expect(result).toBe(mainnet);
    });
  });
});
