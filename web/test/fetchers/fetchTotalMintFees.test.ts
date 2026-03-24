import type { QueryClient } from "@tanstack/react-query";
import type { Token } from "types";
import { zeroAddress, type Client } from "viem";
import { sepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { fetchTotalMintFees } from "../../src/fetchers/fetchTotalMintFees";

vi.mock("@hemilabs/react-hooks/useEstimateFees", () => ({
  estimateFeesQueryOptions: vi.fn().mockReturnValue({
    queryFn: () => 0n,
  }),
}));

vi.mock("@vetro/gateway", () => ({
  getGatewayAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("hooks/useMintFee", () => ({
  mintFeeOptions: vi.fn().mockReturnValue({
    queryFn: () => 0n,
  }),
}));

vi.mock("hooks/useSwapMintFees", () => ({
  mintGasUnitsOptions: vi.fn().mockReturnValue({
    queryFn: () => 100000n,
  }),
}));

vi.mock("hooks/useTokenPrices", () => ({
  tokenPricesOptions: vi.fn().mockReturnValue({
    queryFn: () => ({}),
  }),
}));

vi.mock("providers/web3Provider", () => ({
  config: {},
}));

describe("fetchTotalMintFees", function () {
  const mockOwner = zeroAddress;
  const mockClient = { chain: { id: 1 } } as unknown as Client;
  // @ts-expect-error - Only address, decimals and symbol are needed for these tests
  const mockToken = {
    address: zeroAddress,
    decimals: 6,
    symbol: "USDC",
  } as Token;

  const mockQueryClient = {
    ensureQueryData: vi.fn(),
  } as unknown as QueryClient;

  it("returns correct total fee in USD", async function () {
    const gasUnits = 100000n;
    // 0.001 ETH in wei
    const networkFeeWei = 1000000000000000n;
    // 100 bps = 1%
    const protocolFeeBps = 100n;
    // amount is 1 USDC (6 decimals)
    const amount = 1000000n;

    vi.mocked(mockQueryClient.ensureQueryData)
      // mintGasUnitsOptions
      .mockResolvedValueOnce(gasUnits)
      // estimateFeesQueryOptions
      .mockResolvedValueOnce(networkFeeWei)
      // mintFeeOptions
      .mockResolvedValueOnce(protocolFeeBps)
      // tokenPricesOptions
      .mockResolvedValueOnce({ ETH: "2000", USDC: "1" });

    const result = await fetchTotalMintFees({
      amount,
      approveAmount: amount,
      chain: sepolia,
      client: mockClient,
      fromToken: mockToken,
      minPeggedTokenOut: 0n,
      owner: mockOwner,
      queryClient: mockQueryClient,
    });

    // network: 0.001 ETH * 2000 = $2
    // protocol: 1% of 1 USDC = 0.01 USDC * $1 = $0.01
    // total: $2.01
    expect(result).toBeCloseTo(2.01);
  });

  it("returns zero when both fees are zero", async function () {
    vi.mocked(mockQueryClient.ensureQueryData)
      // mintGasUnitsOptions
      .mockResolvedValueOnce(100000n)
      // estimateFeesQueryOptions
      .mockResolvedValueOnce(0n)
      // mintFeeOptions
      .mockResolvedValueOnce(0n)
      // tokenPricesOptions
      .mockResolvedValueOnce({ ETH: "2000", USDC: "1" });

    const result = await fetchTotalMintFees({
      amount: 1000000n,
      approveAmount: 1000000n,
      chain: sepolia,
      client: mockClient,
      fromToken: mockToken,
      minPeggedTokenOut: 0n,
      owner: mockOwner,
      queryClient: mockQueryClient,
    });

    expect(result).toBe(0);
  });

  it("handles undefined network fee", async function () {
    // 100 bps = 1%
    const protocolFeeBps = 100n;
    const amount = 1000000n;

    vi.mocked(mockQueryClient.ensureQueryData)
      // mintGasUnitsOptions
      .mockResolvedValueOnce(100000n)
      // estimateFeesQueryOptions
      .mockResolvedValueOnce(undefined)
      // mintFeeOptions
      .mockResolvedValueOnce(protocolFeeBps)
      // tokenPricesOptions
      .mockResolvedValueOnce({ ETH: "2000", USDC: "1" });

    const result = await fetchTotalMintFees({
      amount,
      approveAmount: amount,
      chain: sepolia,
      client: mockClient,
      fromToken: mockToken,
      minPeggedTokenOut: 0n,
      owner: mockOwner,
      queryClient: mockQueryClient,
    });

    // network: 0 (undefined → 0n)
    // protocol: 1% of 1 USDC = $0.01
    expect(result).toBeCloseTo(0.01);
  });
});
