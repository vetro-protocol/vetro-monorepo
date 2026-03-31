import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { redeemDelayOptions } from "hooks/useRedeemDelay";
import {
  treasuryReservesOptions,
  treasuryReservesQueryKey,
} from "hooks/useTreasuryReserves";
import type { Token } from "types";
import { zeroAddress, type Client } from "viem";
import { estimateGas } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { estimateApprovalGasUnits } from "../../src/fetchers/estimateApprovalGasUnits";
import { fetchRedeemGasUnits } from "../../src/fetchers/fetchRedeemGasUnits";
import { createTestQueryClient } from "../utils";

vi.mock("../../src/fetchers/estimateApprovalGasUnits", () => ({
  estimateApprovalGasUnits: vi.fn(),
}));

vi.mock("@vetro-protocol/gateway", () => ({
  getGatewayAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("@vetro-protocol/gateway/actions", () => ({
  encodeRedeem: vi.fn().mockReturnValue("0x"),
}));

vi.mock("hooks/useRedeemDelay", () => ({
  redeemDelayOptions: vi.fn().mockReturnValue({
    queryFn: () => 0n,
    queryKey: ["redeem-delay"],
  }),
}));

vi.mock("hooks/useTreasuryReserves", () => ({
  treasuryReservesOptions: vi.fn(),
  treasuryReservesQueryKey: vi.fn(
    ({
      chainId,
      gatewayAddress,
    }: {
      chainId: number;
      gatewayAddress: string;
    }) => ["treasury-reserves", chainId, gatewayAddress],
  ),
}));

vi.mock("viem/actions", () => ({
  estimateGas: vi.fn(),
}));

vi.mock("utils/erc20StateOverride", () => ({
  createErc20AllowanceStateOverride: vi.fn(),
}));

const chainId = 1;

describe("fetchRedeemGasUnits", function () {
  const mockOwner = zeroAddress;
  const mockClient = { chain: { id: chainId } } as unknown as Client;
  // @ts-expect-error - Only address is needed for these tests
  const mockToken = {
    address: zeroAddress,
  } as Token;
  const mockTokenOut = zeroAddress;
  const mockReservesQueryKey = treasuryReservesQueryKey({
    chainId,
    gatewayAddress: zeroAddress,
  });

  function createPrepopulatedQueryClient({
    balance = 1000n,
    reserveAmount = 1000n,
  } = {}) {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      tokenBalanceQueryKey({ address: zeroAddress, chainId }, mockOwner),
      balance,
    );
    queryClient.setQueryData(mockReservesQueryKey, [
      {
        amount: reserveAmount,
        // @ts-expect-error Only address is needed for these tests
        token: { address: mockTokenOut } as Token,
      },
    ]);
    vi.mocked(treasuryReservesOptions).mockReturnValue({
      queryFn: vi.fn() as never,
      queryKey: mockReservesQueryKey as never,
    });
    return queryClient;
  }

  it("returns approval + operation gas for whitelisted users", async function () {
    const approvalGas = 46000n;
    const operationGas = 120000n;
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(approvalGas);
    vi.mocked(estimateGas).mockResolvedValue(operationGas);

    const result = await fetchRedeemGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      minAmountOut: 90n,
      owner: mockOwner,
      queryClient,
      token: mockToken,
      tokenOut: mockTokenOut,
    });

    expect(result).toBe(approvalGas + operationGas);
  });

  it("returns only operation gas for two-step redeemers", async function () {
    const operationGas = 120000n;
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(redeemDelayOptions).mockReturnValue({
      queryFn: () => 86400n,
      queryKey: ["redeem-delay"] as never,
    });
    vi.mocked(estimateGas).mockResolvedValue(operationGas);

    const result = await fetchRedeemGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      minAmountOut: 90n,
      owner: mockOwner,
      queryClient,
      token: mockToken,
      tokenOut: mockTokenOut,
    });

    expect(result).toBe(operationGas);
  });

  it("returns only operation gas when whitelisted but no approval needed", async function () {
    const operationGas = 120000n;
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(redeemDelayOptions).mockReturnValue({
      queryFn: () => 0n,
      queryKey: ["redeem-delay"] as never,
    });
    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(0n);
    vi.mocked(estimateGas).mockResolvedValue(operationGas);

    const result = await fetchRedeemGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      minAmountOut: 90n,
      owner: mockOwner,
      queryClient,
      token: mockToken,
      tokenOut: mockTokenOut,
    });

    expect(result).toBe(operationGas);
  });

  it("throws when amount exceeds token balance for instant redeem", async function () {
    const queryClient = createPrepopulatedQueryClient({ balance: 50n });

    vi.mocked(redeemDelayOptions).mockReturnValue({
      queryFn: () => 0n,
      queryKey: ["redeem-delay"] as never,
    });

    await expect(
      fetchRedeemGasUnits({
        amount: 100n,
        approveAmount: 100n,
        client: mockClient,
        minAmountOut: 90n,
        owner: mockOwner,
        queryClient,
        token: mockToken,
        tokenOut: mockTokenOut,
      }),
    ).rejects.toThrow("Insufficient token balance");

    expect(estimateGas).not.toHaveBeenCalled();
  });

  it("throws when treasury reserves are insufficient for two-step redeem", async function () {
    const queryClient = createPrepopulatedQueryClient({
      reserveAmount: 50n,
    });

    vi.mocked(redeemDelayOptions).mockReturnValue({
      queryFn: () => 86400n,
      queryKey: ["redeem-delay"] as never,
    });

    await expect(
      fetchRedeemGasUnits({
        amount: 100n,
        approveAmount: 100n,
        client: mockClient,
        minAmountOut: 90n,
        owner: mockOwner,
        queryClient,
        token: mockToken,
        tokenOut: mockTokenOut,
      }),
    ).rejects.toThrow("Insufficient treasury reserves");

    expect(estimateGas).not.toHaveBeenCalled();
  });
});
