import type { QueryClient } from "@tanstack/react-query";
import type { Token } from "types";
import { zeroAddress, type Client } from "viem";
import { describe, expect, it, vi } from "vitest";

import { estimateApprovalGasUnits } from "../../src/fetchers/estimateApprovalGasUnits";
import { fetchMintGasUnits } from "../../src/fetchers/fetchMintGasUnits";

vi.mock("../../src/fetchers/estimateApprovalGasUnits", () => ({
  estimateApprovalGasUnits: vi.fn(),
}));

vi.mock("@vetro/gateway", () => ({
  getGatewayAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("hooks/useEstimateDepositGas", () => ({
  depositGasUnitsOptions: vi.fn().mockReturnValue({
    queryFn: () => 120000n,
  }),
}));

describe("fetchMintGasUnits", function () {
  const mockOwner = zeroAddress;
  const mockClient = { chain: { id: 1 } } as unknown as Client;
  // @ts-expect-error - Only address is needed for these tests
  const mockToken = {
    address: zeroAddress,
  } as Token;

  const mockQueryClient = {
    ensureQueryData: vi.fn(),
  } as unknown as QueryClient;

  it("returns sum of approval and mint gas", async function () {
    const approvalGas = 46000n;
    const mintGas = 120000n;

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(approvalGas);
    vi.mocked(mockQueryClient.ensureQueryData).mockResolvedValue(mintGas);

    const result = await fetchMintGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      minPeggedTokenOut: 90n,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
    });

    expect(result).toBe(approvalGas + mintGas);
  });

  it("returns only mint gas when no approval needed", async function () {
    const mintGas = 120000n;

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(0n);
    vi.mocked(mockQueryClient.ensureQueryData).mockResolvedValue(mintGas);

    const result = await fetchMintGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      minPeggedTokenOut: 90n,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
    });

    expect(result).toBe(mintGas);
  });
});
