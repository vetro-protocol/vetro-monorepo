import { estimateFeesQueryOptions } from "@hemilabs/react-hooks/useEstimateFees";
import { pricesOptions } from "hooks/usePrices";
import { redeemFeeOptions } from "hooks/useRedeemFee";
import { redeemGasUnitsOptions } from "hooks/useSwapRedeemFees";
import type { Token } from "types";
import { zeroAddress, type Client } from "viem";
import { sepolia } from "viem/chains";
import { describe, expect, it, vi } from "vitest";

import { fetchTotalRedeemFees } from "../../src/fetchers/fetchTotalRedeemFees";
import { createTestQueryClient } from "../utils";

vi.mock("@hemilabs/react-hooks/useEstimateFees", () => ({
  estimateFeesQueryOptions: vi.fn().mockReturnValue({
    queryFn: () => 0n,
    queryKey: ["estimate-fees"],
  }),
}));

vi.mock("@vetro-protocol/gateway", () => ({
  getGatewayAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("hooks/usePrices", () => ({
  pricesOptions: vi.fn().mockReturnValue({
    queryFn: () => ({}),
    queryKey: ["prices"],
  }),
}));

vi.mock("hooks/useRedeemFee", () => ({
  redeemFeeOptions: vi.fn().mockReturnValue({
    queryFn: () => 0n,
    queryKey: ["redeem-fee"],
  }),
}));

vi.mock("hooks/useSwapRedeemFees", () => ({
  redeemGasUnitsOptions: vi.fn().mockReturnValue({
    queryFn: () => 100000n,
    queryKey: ["redeem-gas-units"],
  }),
}));

vi.mock("providers/web3Provider", () => ({
  config: {},
}));

describe("fetchTotalRedeemFees", function () {
  const mockOwner = zeroAddress;
  const mockClient = { chain: { id: 1 } } as unknown as Client;
  // @ts-expect-error - Only address, decimals and symbol are needed for these tests
  const mockToken = {
    address: zeroAddress,
    decimals: 6,
    symbol: "USDC",
  } as Token;
  const mockTokenOut = zeroAddress;

  it("returns correct total fee in USD", async function () {
    // 0.001 ETH in wei
    const networkFeeWei = 1000000000000000n;
    // 100 bps = 1%
    const protocolFeeBps = 100n;
    // amount is 1 USDC (6 decimals)
    const amount = 1000000n;

    const queryClient = createTestQueryClient();

    vi.mocked(redeemGasUnitsOptions).mockReturnValue({
      queryFn: () => 100000n,
      queryKey: ["redeem-gas-units"],
    } as never);
    vi.mocked(estimateFeesQueryOptions).mockReturnValue({
      queryFn: () => networkFeeWei,
      queryKey: ["estimate-fees"],
    } as never);
    vi.mocked(redeemFeeOptions).mockReturnValue({
      queryFn: () => protocolFeeBps,
      queryKey: ["redeem-fee"],
    } as never);
    vi.mocked(pricesOptions).mockReturnValue({
      queryFn: () => ({ ETH: "2000", USDC: "1" }),
      queryKey: ["prices"],
    } as never);

    const result = await fetchTotalRedeemFees({
      amount,
      approveAmount: amount,
      chain: sepolia,
      client: mockClient,
      fromToken: mockToken,
      minAmountOut: 0n,
      owner: mockOwner,
      queryClient,
      tokenOut: mockTokenOut,
    });

    // network: 0.001 ETH * 2000 = $2
    // protocol: 1% of 1 USDC = 0.01 USDC * $1 = $0.01
    // total: $2.01
    expect(result).toBeCloseTo(2.01);
  });

  it("returns zero when both fees are zero", async function () {
    const queryClient = createTestQueryClient();

    vi.mocked(redeemGasUnitsOptions).mockReturnValue({
      queryFn: () => 100000n,
      queryKey: ["redeem-gas-units"],
    } as never);
    vi.mocked(estimateFeesQueryOptions).mockReturnValue({
      queryFn: () => 0n,
      queryKey: ["estimate-fees"],
    } as never);
    vi.mocked(redeemFeeOptions).mockReturnValue({
      queryFn: () => 0n,
      queryKey: ["redeem-fee"],
    } as never);
    vi.mocked(pricesOptions).mockReturnValue({
      queryFn: () => ({ ETH: "2000", USDC: "1" }),
      queryKey: ["prices"],
    } as never);

    const result = await fetchTotalRedeemFees({
      amount: 1000000n,
      approveAmount: 1000000n,
      chain: sepolia,
      client: mockClient,
      fromToken: mockToken,
      minAmountOut: 0n,
      owner: mockOwner,
      queryClient,
      tokenOut: mockTokenOut,
    });

    expect(result).toBe(0);
  });

  it("handles zero network fee", async function () {
    // 100 bps = 1%
    const protocolFeeBps = 100n;
    const amount = 1000000n;

    const queryClient = createTestQueryClient();

    vi.mocked(redeemGasUnitsOptions).mockReturnValue({
      queryFn: () => 100000n,
      queryKey: ["redeem-gas-units"],
    } as never);
    vi.mocked(estimateFeesQueryOptions).mockReturnValue({
      queryFn: () => 0n,
      queryKey: ["estimate-fees"],
    } as never);
    vi.mocked(redeemFeeOptions).mockReturnValue({
      queryFn: () => protocolFeeBps,
      queryKey: ["redeem-fee"],
    } as never);
    vi.mocked(pricesOptions).mockReturnValue({
      queryFn: () => ({ ETH: "2000", USDC: "1" }),
      queryKey: ["prices"],
    } as never);

    const result = await fetchTotalRedeemFees({
      amount,
      approveAmount: amount,
      chain: sepolia,
      client: mockClient,
      fromToken: mockToken,
      minAmountOut: 0n,
      owner: mockOwner,
      queryClient,
      tokenOut: mockTokenOut,
    });

    // network: 0
    // protocol: 1% of 1 USDC = $0.01
    expect(result).toBeCloseTo(0.01);
  });
});
