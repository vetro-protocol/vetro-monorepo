import type { QueryClient } from "@tanstack/react-query";
import type { Token } from "types";
import { zeroAddress, type Client } from "viem";
import { estimateGas } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { estimateApprovalGasUnits } from "../../src/fetchers/estimateApprovalGasUnits";
import { fetchRequestRedeemGasUnits } from "../../src/fetchers/fetchRequestRedeemGasUnits";

vi.mock("../../src/fetchers/estimateApprovalGasUnits", () => ({
  estimateApprovalGasUnits: vi.fn(),
}));

vi.mock("@vetro/gateway", () => ({
  getGatewayAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("@vetro/gateway/actions", () => ({
  encodeRequestRedeem: vi.fn().mockReturnValue("0x"),
}));

vi.mock("viem/actions", () => ({
  estimateGas: vi.fn(),
}));

vi.mock("utils/erc20StateOverride", () => ({
  createErc20AllowanceStateOverride: vi.fn(),
}));

describe("fetchRequestRedeemGasUnits", function () {
  const mockOwner = zeroAddress;
  const mockClient = { chain: { id: 1 } } as unknown as Client;
  // @ts-expect-error We just need the token address
  const mockToken = {
    address: zeroAddress,
  } as Token;

  const mockQueryClient = {} as unknown as QueryClient;

  it("returns sum of approval and operation gas", async function () {
    const approvalGas = 46000n;
    const operationGas = 120000n;

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(approvalGas);
    vi.mocked(estimateGas).mockResolvedValue(operationGas);

    const result = await fetchRequestRedeemGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
    });

    expect(result).toBe(approvalGas + operationGas);
  });

  it("returns only operation gas when no approval needed", async function () {
    const operationGas = 120000n;

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(0n);
    vi.mocked(estimateGas).mockResolvedValue(operationGas);

    const result = await fetchRequestRedeemGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
    });

    expect(result).toBe(operationGas);
  });
});
