import { tokenConfigOptions } from "hooks/useTokenConfig";
import { whitelistedTokensOptions } from "hooks/useWhitelistedTokens";
import type { Token } from "types";
import { type Address, type Client, zeroAddress } from "viem";
import { readContract } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { fetchOraclePrices } from "../../src/fetchers/fetchOraclePrices";
import { createTestQueryClient } from "../utils";

vi.mock("@vetro-protocol/gateway", () => ({
  getGatewayAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("hooks/useTokenConfig", () => ({
  tokenConfigOptions: vi.fn().mockReturnValue({
    queryFn: () => ({ oracle: zeroAddress }),
    queryKey: ["token-config"],
  }),
}));

vi.mock("hooks/useWhitelistedTokens", () => ({
  whitelistedTokensOptions: vi.fn().mockReturnValue({
    queryFn: () => [],
    queryKey: ["whitelisted-tokens"],
  }),
}));

vi.mock("viem/actions", () => ({
  readContract: vi.fn(),
}));

const oracleAddress = "0x1111111111111111111111111111111111111111" as Address;

const createMockToken = (
  symbol: string,
  address: Address,
  priceSymbol?: string,
): Token => ({
  address,
  chainId: 1,
  decimals: 18,
  extensions: priceSymbol ? { priceSymbol } : undefined,
  logoURI: "",
  name: symbol,
  symbol,
});

describe("fetchOraclePrices", function () {
  const mockClient = { chain: { id: 1 } } as unknown as Client;

  it("returns oracle prices for whitelisted tokens", async function () {
    const usdc = createMockToken(
      "USDC",
      "0x2222222222222222222222222222222222222222",
    );
    const queryClient = createTestQueryClient();

    vi.mocked(whitelistedTokensOptions).mockReturnValue({
      queryFn: () => [usdc],
      queryKey: ["whitelisted-tokens"],
    } as never);
    vi.mocked(tokenConfigOptions).mockReturnValue({
      queryFn: () => ({ oracle: oracleAddress }),
      queryKey: ["token-config"],
    } as never);
    vi.mocked(readContract)
      // latestAnswer
      .mockResolvedValueOnce(100000000n)
      // decimals
      .mockResolvedValueOnce(8);

    const result = await fetchOraclePrices({
      client: mockClient,
      queryClient,
    });

    expect(result).toEqual({ USDC: "1" });
  });

  it("uses priceSymbol from token extensions when available", async function () {
    const hemiBtc = createMockToken(
      "hemiBTC",
      "0x3333333333333333333333333333333333333333",
      "BTC",
    );
    const queryClient = createTestQueryClient();

    vi.mocked(whitelistedTokensOptions).mockReturnValue({
      queryFn: () => [hemiBtc],
      queryKey: ["whitelisted-tokens"],
    } as never);
    vi.mocked(tokenConfigOptions).mockReturnValue({
      queryFn: () => ({ oracle: oracleAddress }),
      queryKey: ["token-config"],
    } as never);
    // BTC price: $60,000 with 8 decimals
    vi.mocked(readContract)
      .mockResolvedValueOnce(6000000000000n)
      .mockResolvedValueOnce(8);

    const result = await fetchOraclePrices({
      client: mockClient,
      queryClient,
    });

    expect(result).toEqual({ BTC: "60000" });
  });

  it("returns prices for multiple tokens", async function () {
    const usdc = createMockToken(
      "USDC",
      "0x2222222222222222222222222222222222222222",
    );
    const wbtc = createMockToken(
      "WBTC",
      "0x3333333333333333333333333333333333333333",
    );
    const queryClient = createTestQueryClient();

    vi.mocked(whitelistedTokensOptions).mockReturnValue({
      queryFn: () => [usdc, wbtc],
      queryKey: ["whitelisted-tokens"],
    } as never);
    vi.mocked(tokenConfigOptions).mockReturnValue({
      queryFn: () => ({ oracle: oracleAddress }),
      queryKey: ["token-config"],
    } as never);
    vi.mocked(readContract)
      // USDC: latestAnswer, decimals
      .mockResolvedValueOnce(100000000n)
      .mockResolvedValueOnce(8)
      // WBTC: latestAnswer, decimals
      .mockResolvedValueOnce(6000000000000n)
      .mockResolvedValueOnce(8);

    const result = await fetchOraclePrices({
      client: mockClient,
      queryClient,
    });

    expect(result).toEqual({ USDC: "1", WBTC: "60000" });
  });

  it("returns empty object when no whitelisted tokens", async function () {
    const queryClient = createTestQueryClient();

    vi.mocked(whitelistedTokensOptions).mockReturnValue({
      queryFn: () => [],
      queryKey: ["whitelisted-tokens"],
    } as never);

    const result = await fetchOraclePrices({
      client: mockClient,
      queryClient,
    });

    expect(result).toEqual({});
  });
});
