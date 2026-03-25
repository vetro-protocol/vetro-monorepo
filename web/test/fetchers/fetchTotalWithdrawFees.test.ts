import type { QueryClient } from "@tanstack/react-query";
import { type Client, zeroAddress } from "viem";
import { sepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { fetchTotalWithdrawFees } from "../../src/fetchers/fetchTotalWithdrawFees";

vi.mock("@hemilabs/react-hooks/useEstimateFees", () => ({
  estimateFeesQueryOptions: vi.fn().mockReturnValue({
    queryFn: () => 0n,
  }),
}));

vi.mock("pages/earn/hooks/useWithdrawFees", () => ({
  withdrawGasUnitsOptions: vi.fn().mockReturnValue({
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

describe("fetchTotalWithdrawFees", function () {
  const mockClient = { chain: { id: 1 } } as unknown as Client;
  const mockOwner = zeroAddress;

  const mockQueryClient = {
    ensureQueryData: vi.fn(),
  } as unknown as QueryClient;

  it("returns correct network fee in USD", async function () {
    const gasUnits = 95000n;
    // 0.002 ETH in wei
    const networkFeeWei = 2000000000000000n;

    vi.mocked(mockQueryClient.ensureQueryData)
      // withdrawGasUnitsOptions
      .mockResolvedValueOnce(gasUnits)
      // estimateFeesQueryOptions
      .mockResolvedValueOnce(networkFeeWei)
      // tokenPricesOptions
      .mockResolvedValueOnce({ ETH: "2000" });

    const result = await fetchTotalWithdrawFees({
      amount: 1000000000000000000n,
      chain: sepolia,
      client: mockClient,
      owner: mockOwner,
      queryClient: mockQueryClient,
    });

    // 0.002 ETH * 2000 = $4
    expect(result).toBeCloseTo(4);
  });

  it("returns zero when network fee is zero", async function () {
    vi.mocked(mockQueryClient.ensureQueryData)
      .mockResolvedValueOnce(95000n)
      .mockResolvedValueOnce(0n)
      .mockResolvedValueOnce({ ETH: "2000" });

    const result = await fetchTotalWithdrawFees({
      amount: 1000000000000000000n,
      chain: sepolia,
      client: mockClient,
      owner: mockOwner,
      queryClient: mockQueryClient,
    });

    expect(result).toBe(0);
  });

  it("handles undefined network fee", async function () {
    vi.mocked(mockQueryClient.ensureQueryData)
      .mockResolvedValueOnce(95000n)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ ETH: "2000" });

    const result = await fetchTotalWithdrawFees({
      amount: 1000000000000000000n,
      chain: sepolia,
      client: mockClient,
      owner: mockOwner,
      queryClient: mockQueryClient,
    });

    expect(result).toBe(0);
  });
});
