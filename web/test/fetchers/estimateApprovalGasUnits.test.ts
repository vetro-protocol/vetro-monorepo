import { type QueryClient } from "@tanstack/react-query";
import type { Token } from "types";
import { zeroAddress, type Client } from "viem";
import { describe, expect, it, vi } from "vitest";

vi.mock("@hemilabs/react-hooks/useAllowance", () => ({
  allowanceQueryOptions: vi.fn().mockReturnValue({ queryKey: ["allowance"] }),
}));

vi.mock("wagmi/query", () => ({
  estimateGasQueryOptions: vi.fn().mockReturnValue({ queryKey: ["gas"] }),
}));

vi.mock("providers/web3Provider", () => ({
  config: { mock: true },
}));

import { estimateApprovalGasUnits } from "../../src/fetchers/estimateApprovalGasUnits";

describe("estimateApprovalGasUnits", function () {
  const amount = 100n;
  const mockOwner = zeroAddress;
  const mockSpender = zeroAddress;
  const client = { chain: { id: 1 } } as Client;
  const token = { address: zeroAddress } as Token;

  it("returns 0n when allowance > amount", async function () {
    const queryClient = {
      ensureQueryData: vi.fn().mockResolvedValue(amount + 1n),
    } as unknown as QueryClient;

    const result = await estimateApprovalGasUnits({
      amount,
      approveAmount: undefined,
      client,
      owner: mockOwner,
      queryClient,
      spender: mockSpender,
      token,
    });

    expect(result).toBe(0n);
    expect(queryClient.ensureQueryData).toHaveBeenCalledTimes(1);
  });

  it("returns 0n when allowance === amount", async function () {
    const queryClient = {
      ensureQueryData: vi.fn().mockResolvedValue(amount),
    } as unknown as QueryClient;

    const result = await estimateApprovalGasUnits({
      amount,
      approveAmount: undefined,
      client,
      owner: mockOwner,
      queryClient,
      spender: mockSpender,
      token,
    });

    expect(result).toBe(0n);
    expect(queryClient.ensureQueryData).toHaveBeenCalledTimes(1);
  });

  it("returns gas estimate when allowance < amount", async function () {
    const gasEstimate = 46000n;
    const queryClient = {
      ensureQueryData: vi
        .fn()
        .mockResolvedValueOnce(amount - 1n) // allowance
        .mockResolvedValueOnce(gasEstimate), // gas estimate
    } as unknown as QueryClient;

    const result = await estimateApprovalGasUnits({
      amount,
      approveAmount: undefined,
      client,
      owner: mockOwner,
      queryClient,
      spender: mockSpender,
      token: token as never,
    });

    expect(result).toBe(gasEstimate);
    expect(queryClient.ensureQueryData).toHaveBeenCalledTimes(2);
  });
});
