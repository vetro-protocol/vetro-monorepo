import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import type { Token } from "types";
import { zeroAddress, type Client } from "viem";
import { estimateGas } from "viem/actions";
import { describe, expect, it, vi } from "vitest";

import { estimateApprovalGasUnits } from "../../src/fetchers/estimateApprovalGasUnits";
import { fetchMintGasUnits } from "../../src/fetchers/fetchMintGasUnits";
import { createTestQueryClient } from "../utils";

vi.mock("../../src/fetchers/estimateApprovalGasUnits", () => ({
  estimateApprovalGasUnits: vi.fn(),
}));

vi.mock("@vetro/gateway", () => ({
  getGatewayAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("@vetro/gateway/actions", () => ({
  encodeDeposit: vi.fn().mockReturnValue("0x"),
}));

vi.mock("viem/actions", () => ({
  estimateGas: vi.fn(),
}));

vi.mock("utils/erc20StateOverride", () => ({
  createErc20AllowanceStateOverride: vi.fn(),
}));

const chainId = 1;

describe("fetchMintGasUnits", function () {
  const mockOwner = zeroAddress;
  const mockClient = { chain: { id: chainId } } as unknown as Client;
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

  it("returns sum of approval and mint gas", async function () {
    const approvalGas = 46000n;
    const mintGas = 120000n;
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(approvalGas);
    vi.mocked(estimateGas).mockResolvedValue(mintGas);

    const result = await fetchMintGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      minPeggedTokenOut: 90n,
      owner: mockOwner,
      queryClient,
      token: mockToken,
    });

    expect(result).toBe(approvalGas + mintGas);
  });

  it("returns only mint gas when no approval needed", async function () {
    const mintGas = 120000n;
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(estimateApprovalGasUnits).mockResolvedValue(0n);
    vi.mocked(estimateGas).mockResolvedValue(mintGas);

    const result = await fetchMintGasUnits({
      amount: 100n,
      approveAmount: 100n,
      client: mockClient,
      minPeggedTokenOut: 90n,
      owner: mockOwner,
      queryClient,
      token: mockToken,
    });

    expect(result).toBe(mintGas);
  });

  it("throws when amount exceeds token balance", async function () {
    const queryClient = createPrepopulatedQueryClient(50n);

    await expect(
      fetchMintGasUnits({
        amount: 100n,
        approveAmount: 100n,
        client: mockClient,
        minPeggedTokenOut: 90n,
        owner: mockOwner,
        queryClient,
        token: mockToken,
      }),
    ).rejects.toThrow("Insufficient token balance");

    expect(estimateGas).not.toHaveBeenCalled();
  });
});
