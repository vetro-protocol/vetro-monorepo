import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import type { Token } from "@vetro-protocol/core";
import { createErc20SpendStateOverride } from "utils/erc20StateOverride";
import { type Client, zeroAddress, zeroHash } from "viem";
import { estimateGas } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { estimateApprovalGasUnits } from "../../src/fetchers/estimateApprovalGasUnits";
import { fetchSupplyCollateralGasUnits } from "../../src/fetchers/fetchSupplyCollateralGasUnits";
import { morphoMarketQueryKey } from "../../src/hooks/borrow/useMorphoMarket";
import { createTestQueryClient } from "../utils";

vi.mock("../../src/fetchers/estimateApprovalGasUnits", () => ({
  estimateApprovalGasUnits: vi.fn(),
}));

vi.mock("@morpho-org/blue-sdk", () => ({
  getChainAddresses: vi.fn().mockReturnValue({ blue: zeroAddress }),
}));

vi.mock("@vetro-protocol/morpho-blue-market/actions", () => ({
  encodeSupplyCollateral: vi.fn().mockReturnValue("0x"),
}));

vi.mock("viem/actions", () => ({
  estimateGas: vi.fn(),
}));

vi.mock("utils/erc20StateOverride", () => ({
  createErc20SpendStateOverride: vi.fn(),
}));

const chainId = 1;

describe("fetchSupplyCollateralGasUnits", function () {
  const mockClient = { chain: { id: chainId } } as unknown as Client;
  const mockOwner = zeroAddress;
  // @ts-expect-error - Only address is needed for these tests
  const mockToken = {
    address: zeroAddress,
  } as Token;

  function createPrepopulatedQueryClient(collateralBalance = 1000n) {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      morphoMarketQueryKey({ chainId, marketId: zeroHash }),
      { params: {} },
    );
    queryClient.setQueryData(
      tokenBalanceQueryKey({ address: zeroAddress, chainId }, mockOwner),
      collateralBalance,
    );
    return queryClient;
  }

  it("returns sum of approval and supply collateral gas", async function () {
    const approvalGas = 46000n;
    const supplyGas = 130000n;
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(approvalGas);
    vi.mocked(estimateGas).mockResolvedValue(supplyGas);

    const result = await fetchSupplyCollateralGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      marketId: zeroHash,
      owner: mockOwner,
      queryClient,
      token: mockToken,
    });

    expect(result).toBe(approvalGas + supplyGas);
  });

  it("returns only supply collateral gas when no approval needed", async function () {
    const supplyGas = 130000n;
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(0n);
    vi.mocked(estimateGas).mockResolvedValue(supplyGas);

    const result = await fetchSupplyCollateralGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      marketId: zeroHash,
      owner: mockOwner,
      queryClient,
      token: mockToken,
    });

    expect(result).toBe(supplyGas);
  });

  it("estimates with the balance overridden when the amount exceeds the balance", async function () {
    const supplyGas = 130000n;
    const queryClient = createPrepopulatedQueryClient(50n);
    const stateOverride = [{ address: zeroAddress, stateDiff: [] }];

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(0n);
    vi.mocked(estimateGas).mockResolvedValue(supplyGas);
    vi.mocked(createErc20SpendStateOverride).mockReturnValueOnce(stateOverride);

    const result = await fetchSupplyCollateralGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      marketId: zeroHash,
      owner: mockOwner,
      queryClient,
      token: mockToken,
    });

    expect(result).toBe(supplyGas);
    expect(createErc20SpendStateOverride).toHaveBeenCalledWith({
      amount: 100n,
      balance: 50n,
      owner: mockOwner,
      spender: zeroAddress,
      token: mockToken,
    });
    expect(vi.mocked(estimateGas).mock.lastCall?.[1].stateOverride).toBe(
      stateOverride,
    );
  });
});
