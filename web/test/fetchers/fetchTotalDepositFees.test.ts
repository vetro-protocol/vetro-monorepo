import type { QueryClient } from "@tanstack/react-query";
import type { Token } from "types";
import { type Client, zeroAddress } from "viem";
import { sepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { fetchTotalDepositFees } from "../../src/fetchers/fetchTotalDepositFees";

vi.mock("@hemilabs/react-hooks/useEstimateFees", () => ({
  estimateFeesQueryOptions: vi.fn().mockReturnValue({
    queryFn: () => 0n,
  }),
}));

vi.mock("pages/earn/hooks/useDepositFees", () => ({
  depositGasUnitsOptions: vi.fn().mockReturnValue({
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

describe("fetchTotalDepositFees", function () {
  const mockClient = { chain: { id: 1 } } as unknown as Client;
  const mockOwner = zeroAddress;
  // @ts-expect-error - Only address and decimals are needed for these tests
  const mockToken = {
    address: zeroAddress,
    decimals: 18,
  } as Token;

  const mockQueryClient = {
    ensureQueryData: vi.fn(),
  } as unknown as QueryClient;

  it("returns correct network fee in USD", async function () {
    const gasUnits = 100000n;
    // 0.001 ETH in wei
    const networkFeeWei = 1000000000000000n;

    vi.mocked(mockQueryClient.ensureQueryData)
      // depositGasUnitsOptions
      .mockResolvedValueOnce(gasUnits)
      // estimateFeesQueryOptions
      .mockResolvedValueOnce(networkFeeWei)
      // tokenPricesOptions
      .mockResolvedValueOnce({ ETH: "2000" });

    const result = await fetchTotalDepositFees({
      amount: 1000000000000000000n,
      approveAmount: undefined,
      chain: sepolia,
      client: mockClient,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
    });

    // 0.001 ETH * 2000 = $2
    expect(result).toBeCloseTo(2);
  });

  it("returns zero when network fee is zero", async function () {
    vi.mocked(mockQueryClient.ensureQueryData)
      .mockResolvedValueOnce(100000n)
      .mockResolvedValueOnce(0n)
      .mockResolvedValueOnce({ ETH: "2000" });

    const result = await fetchTotalDepositFees({
      amount: 1000000000000000000n,
      approveAmount: undefined,
      chain: sepolia,
      client: mockClient,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
    });

    expect(result).toBe(0);
  });

  it("handles undefined network fee", async function () {
    vi.mocked(mockQueryClient.ensureQueryData)
      .mockResolvedValueOnce(100000n)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ ETH: "2000" });

    const result = await fetchTotalDepositFees({
      amount: 1000000000000000000n,
      approveAmount: undefined,
      chain: sepolia,
      client: mockClient,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
    });

    expect(result).toBe(0);
  });
});
