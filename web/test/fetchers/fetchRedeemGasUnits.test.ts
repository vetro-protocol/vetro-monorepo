import type { QueryClient } from "@tanstack/react-query";
import type { Token } from "types";
import { zeroAddress, type Client } from "viem";
import { estimateGas } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { estimateApprovalGasUnits } from "../../src/fetchers/estimateApprovalGasUnits";
import { fetchRedeemGasUnits } from "../../src/fetchers/fetchRedeemGasUnits";

vi.mock("../../src/fetchers/estimateApprovalGasUnits", () => ({
  estimateApprovalGasUnits: vi.fn(),
}));

vi.mock("@vetro/gateway", () => ({
  getGatewayAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("@vetro/gateway/actions", () => ({
  encodeRedeem: vi.fn().mockReturnValue("0x"),
}));

vi.mock("hooks/useRedeemDelay", () => ({
  redeemDelayOptions: vi.fn().mockReturnValue({
    queryFn: () => 0n,
  }),
}));

vi.mock("viem/actions", () => ({
  estimateGas: vi.fn(),
}));

vi.mock("utils/erc20StateOverride", () => ({
  createErc20AllowanceStateOverride: vi.fn(),
}));

describe("fetchRedeemGasUnits", function () {
  const mockOwner = zeroAddress;
  const mockClient = { chain: { id: 1 } } as unknown as Client;
  // @ts-expect-error - Only address is needed for these tests
  const mockToken = {
    address: zeroAddress,
  } as Token;
  const mockTokenOut = zeroAddress;

  const mockQueryClient = {
    ensureQueryData: vi.fn(),
  } as unknown as QueryClient;

  it("returns approval + operation gas for whitelisted users", async function () {
    const approvalGas = 46000n;
    const operationGas = 120000n;

    vi.mocked(mockQueryClient.ensureQueryData).mockResolvedValue(0n);
    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(approvalGas);
    vi.mocked(estimateGas).mockResolvedValue(operationGas);

    const result = await fetchRedeemGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      minAmountOut: 90n,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
      tokenOut: mockTokenOut,
    });

    expect(result).toBe(approvalGas + operationGas);
  });

  it("returns only operation gas for two-step redeemers", async function () {
    const operationGas = 120000n;

    vi.mocked(mockQueryClient.ensureQueryData).mockResolvedValue(86400n);
    vi.mocked(estimateGas).mockResolvedValue(operationGas);

    const result = await fetchRedeemGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      minAmountOut: 90n,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
      tokenOut: mockTokenOut,
    });

    expect(result).toBe(operationGas);
  });

  it("returns only operation gas when whitelisted but no approval needed", async function () {
    const operationGas = 120000n;

    vi.mocked(mockQueryClient.ensureQueryData).mockResolvedValue(0n);
    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(0n);
    vi.mocked(estimateGas).mockResolvedValue(operationGas);

    const result = await fetchRedeemGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      minAmountOut: 90n,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
      tokenOut: mockTokenOut,
    });

    expect(result).toBe(operationGas);
  });
});
