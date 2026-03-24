import type { QueryClient } from "@tanstack/react-query";
import type { Token } from "types";
import { type Client, zeroAddress } from "viem";
import { estimateGas } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { estimateApprovalGasUnits } from "../../src/fetchers/estimateApprovalGasUnits";
import { fetchDepositGasUnits } from "../../src/fetchers/fetchDepositGasUnits";

vi.mock("../../src/fetchers/estimateApprovalGasUnits", () => ({
  estimateApprovalGasUnits: vi.fn(),
}));

vi.mock("@vetro/earn", async (importOriginal) => ({
  ...(await importOriginal()),
  getStakingVaultAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("viem/actions", () => ({
  estimateGas: vi.fn(),
}));

vi.mock("utils/erc20StateOverride", () => ({
  createErc20AllowanceStateOverride: vi.fn(),
}));

describe("fetchDepositGasUnits", function () {
  const mockClient = { chain: { id: 1 } } as unknown as Client;
  const mockOwner = zeroAddress;
  const mockQueryClient = {} as unknown as QueryClient;
  // @ts-expect-error - Only address is needed for these tests
  const mockToken = {
    address: zeroAddress,
  } as Token;

  it("returns sum of approval and deposit gas", async function () {
    const approvalGas = 46000n;
    const depositGas = 120000n;

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(approvalGas);
    vi.mocked(estimateGas).mockResolvedValue(depositGas);

    const result = await fetchDepositGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
    });

    expect(result).toBe(approvalGas + depositGas);
  });

  it("returns only deposit gas when no approval needed", async function () {
    const depositGas = 120000n;

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(0n);
    vi.mocked(estimateGas).mockResolvedValue(depositGas);

    const result = await fetchDepositGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      owner: mockOwner,
      queryClient: mockQueryClient,
      token: mockToken,
    });

    expect(result).toBe(depositGas);
  });
});
