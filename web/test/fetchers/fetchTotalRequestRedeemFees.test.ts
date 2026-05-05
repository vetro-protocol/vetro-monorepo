import type { QueryClient } from "@tanstack/react-query";
import type { TokenWithGateway } from "types";
import { zeroAddress, type Client } from "viem";
import { sepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { fetchTotalRequestRedeemFees } from "../../src/fetchers/fetchTotalRequestRedeemFees";

vi.mock("@hemilabs/react-hooks/useEstimateFees", () => ({
  estimateFeesQueryOptions: vi.fn().mockReturnValue({
    queryFn: () => 0n,
  }),
}));

vi.mock("hooks/useSwapRequestRedeemFees", () => ({
  requestRedeemGasUnitsOptions: vi.fn().mockReturnValue({
    queryFn: () => 100000n,
  }),
}));

vi.mock("hooks/useTokenPrices", () => ({
  tokenPricesOptions: vi.fn().mockReturnValue({
    queryFn: () => ({}),
  } as never),
}));

vi.mock("providers/web3Provider", () => ({
  config: {},
}));

describe("fetchTotalRequestRedeemFees", function () {
  const mockOwner = zeroAddress;
  const mockClient = { chain: { id: 1 } } as unknown as Client;
  // @ts-expect-error - Only address is needed for these tests
  const mockToken = {
    address: zeroAddress,
    gatewayAddress: "0xDaD503f8B9d42bb7af3AfC588358D30163e4416F",
  } as TokenWithGateway;

  const mockQueryClient = {
    ensureQueryData: vi.fn(),
  } as unknown as QueryClient;

  it("returns correct network fee in USD", async function () {
    const gasUnits = 100000n;
    // 0.001 ETH in wei
    const networkFeeWei = 1000000000000000n;
    vi.mocked(mockQueryClient.ensureQueryData)
      // requestRedeemGasUnitsOptions
      .mockResolvedValueOnce(gasUnits)
      // estimateFeesQueryOptions
      .mockResolvedValueOnce(networkFeeWei)
      // tokenPricesOptions
      .mockResolvedValueOnce({ ETH: "2000" });

    const result = await fetchTotalRequestRedeemFees({
      amount: 100n,
      approveAmount: 100n,
      chain: sepolia,
      client: mockClient,
      fromToken: mockToken as never,
      owner: mockOwner,
      queryClient: mockQueryClient,
    });

    // 0.001 ETH * 2000 USD/ETH = 2 USD
    expect(result).toBe(2);
  });

  it("returns zero when network fee is zero", async function () {
    vi.mocked(mockQueryClient.ensureQueryData)
      // requestRedeemGasUnitsOptions
      .mockResolvedValueOnce(100000n)
      // estimateFeesQueryOptions
      .mockResolvedValueOnce(0n)
      // tokenPricesOptions
      .mockResolvedValueOnce({ ETH: "2000" });

    const result = await fetchTotalRequestRedeemFees({
      amount: 100n,
      approveAmount: 100n,
      chain: sepolia,
      client: mockClient,
      fromToken: mockToken as never,
      owner: mockOwner,
      queryClient: mockQueryClient,
    });

    expect(result).toBe(0);
  });

  it("handles undefined network fee", async function () {
    vi.mocked(mockQueryClient.ensureQueryData)
      // requestRedeemGasUnitsOptions
      .mockResolvedValueOnce(100000n)
      // estimateFeesQueryOptions
      .mockResolvedValueOnce(undefined)
      // tokenPricesOptions
      .mockResolvedValueOnce({ ETH: "2000" });

    const result = await fetchTotalRequestRedeemFees({
      amount: 100n,
      approveAmount: 100n,
      chain: sepolia,
      client: mockClient,
      fromToken: mockToken as never,
      owner: mockOwner,
      queryClient: mockQueryClient,
    });

    expect(result).toBe(0);
  });
});
