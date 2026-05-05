import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import type { Token } from "types";
import { type Client, zeroAddress } from "viem";
import { estimateGas } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { estimateApprovalGasUnits } from "../../src/fetchers/estimateApprovalGasUnits";
import { fetchDepositGasUnits } from "../../src/fetchers/fetchDepositGasUnits";
import { createTestQueryClient } from "../utils";

vi.mock("../../src/fetchers/estimateApprovalGasUnits", () => ({
  estimateApprovalGasUnits: vi.fn(),
}));

vi.mock("viem/actions", () => ({
  estimateGas: vi.fn(),
}));

vi.mock("utils/erc20StateOverride", () => ({
  createErc20AllowanceStateOverride: vi.fn(),
}));

const chainId = 1;

describe("fetchDepositGasUnits", function () {
  const mockClient = { chain: { id: chainId } } as unknown as Client;
  const mockOwner = zeroAddress;
  // @ts-expect-error - Only address and chainId are needed for these tests
  const mockToken = {
    address: zeroAddress,
    chainId,
  } as Token;

  function createPrepopulatedQueryClient(balance = 1000n) {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      tokenBalanceQueryKey({ address: zeroAddress, chainId }, mockOwner),
      balance,
    );
    return queryClient;
  }

  it("returns sum of approval and deposit gas", async function () {
    const approvalGas = 46000n;
    const depositGas = 120000n;
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(approvalGas);
    vi.mocked(estimateGas).mockResolvedValue(depositGas);

    const result = await fetchDepositGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      owner: mockOwner,
      queryClient,
      stakingVaultAddress: stakingVaultAddresses[0],
      token: mockToken,
    });

    expect(result).toBe(approvalGas + depositGas);
  });

  it("returns only deposit gas when no approval needed", async function () {
    const depositGas = 120000n;
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(0n);
    vi.mocked(estimateGas).mockResolvedValue(depositGas);

    const result = await fetchDepositGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      owner: mockOwner,
      queryClient,
      stakingVaultAddress: stakingVaultAddresses[0],
      token: mockToken,
    });

    expect(result).toBe(depositGas);
  });

  it("throws when amount exceeds token balance", async function () {
    const queryClient = createPrepopulatedQueryClient(50n);

    await expect(
      fetchDepositGasUnits({
        amount: 100n,
        approveAmount: 100n,
        client: mockClient,
        owner: mockOwner,
        queryClient,
        stakingVaultAddress: stakingVaultAddresses[0],
        token: mockToken,
      }),
    ).rejects.toThrow("Insufficient token balance");

    expect(estimateGas).not.toHaveBeenCalled();
  });
});
