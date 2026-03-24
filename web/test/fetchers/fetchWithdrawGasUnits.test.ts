import type { QueryClient } from "@tanstack/react-query";
import { type Client, zeroAddress } from "viem";
import { estimateGas } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { fetchWithdrawGasUnits } from "../../src/fetchers/fetchWithdrawGasUnits";

vi.mock("@vetro/earn", async (importOriginal) => ({
  ...(await importOriginal()),
  getStakingVaultAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("pages/earn/hooks/useCanInstantWithdraw", () => ({
  canInstantWithdrawOptions: vi.fn().mockReturnValue({
    queryKey: ["can-instant-withdraw"],
  }),
}));

vi.mock("viem/actions", () => ({
  estimateGas: vi.fn(),
}));

describe("fetchWithdrawGasUnits", function () {
  const mockAccount = zeroAddress;
  const mockClient = { chain: { id: 1 } } as unknown as Client;

  it("returns gas estimate for instant withdraw", async function () {
    const withdrawGas = 95000n;

    const mockQueryClient = {
      ensureQueryData: vi.fn().mockResolvedValue(true),
    } as unknown as QueryClient;

    vi.mocked(estimateGas).mockResolvedValue(withdrawGas);

    const result = await fetchWithdrawGasUnits({
      account: mockAccount,
      amount: 100n,
      client: mockClient,
      queryClient: mockQueryClient,
    });

    expect(result).toBe(withdrawGas);
  });

  it("returns gas estimate for request withdraw", async function () {
    const requestGas = 80000n;

    const mockQueryClient = {
      ensureQueryData: vi.fn().mockResolvedValue(false),
    } as unknown as QueryClient;

    vi.mocked(estimateGas).mockResolvedValue(requestGas);

    const result = await fetchWithdrawGasUnits({
      account: mockAccount,
      amount: 100n,
      client: mockClient,
      queryClient: mockQueryClient,
    });

    expect(result).toBe(requestGas);
  });
});
