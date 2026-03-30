import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { type Client, zeroAddress } from "viem";
import { estimateGas } from "viem/actions";
import { convertToAssets } from "viem-erc4626/actions";
import { describe, expect, it, vi } from "vitest";

import { fetchWithdrawGasUnits } from "../../src/fetchers/fetchWithdrawGasUnits";
import { createTestQueryClient } from "../utils";

vi.mock("@vetro/earn", async (importOriginal) => ({
  ...(await importOriginal()),
  getStakingVaultAddress: vi.fn().mockReturnValue(zeroAddress),
}));

vi.mock("pages/earn/hooks/useCanInstantWithdraw", () => ({
  canInstantWithdrawOptions: vi.fn().mockReturnValue({
    queryFn: () => true,
    queryKey: ["can-instant-withdraw"],
  }),
}));

vi.mock("viem/actions", () => ({
  estimateGas: vi.fn(),
}));

vi.mock("viem-erc4626/actions", () => ({
  convertToAssets: vi.fn(),
}));

const chainId = 1;

describe("fetchWithdrawGasUnits", function () {
  const mockAccount = zeroAddress;
  const mockClient = { chain: { id: chainId } } as unknown as Client;

  function createPrepopulatedQueryClient({
    shares = 1000n,
    stakedBalance = 1000n,
  } = {}) {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      tokenBalanceQueryKey({ address: zeroAddress, chainId }, mockAccount),
      shares,
    );
    vi.mocked(convertToAssets).mockResolvedValue(stakedBalance);
    return queryClient;
  }

  it("returns gas estimate for instant withdraw", async function () {
    const withdrawGas = 95000n;
    const queryClient = createPrepopulatedQueryClient();

    vi.mocked(estimateGas).mockResolvedValue(withdrawGas);

    const result = await fetchWithdrawGasUnits({
      account: mockAccount,
      amount: 100n,
      client: mockClient,
      queryClient,
    });

    expect(result).toBe(withdrawGas);
  });

  it("returns gas estimate for request withdraw", async function () {
    const requestGas = 80000n;
    const queryClient = createPrepopulatedQueryClient();

    const { canInstantWithdrawOptions } =
      await import("pages/earn/hooks/useCanInstantWithdraw");
    vi.mocked(canInstantWithdrawOptions).mockReturnValue({
      queryFn: () => false,
      queryKey: ["can-instant-withdraw"] as never,
    });

    vi.mocked(estimateGas).mockResolvedValue(requestGas);

    const result = await fetchWithdrawGasUnits({
      account: mockAccount,
      amount: 100n,
      client: mockClient,
      queryClient,
    });

    expect(result).toBe(requestGas);
  });

  it("throws when amount exceeds staked balance", async function () {
    const queryClient = createPrepopulatedQueryClient({
      shares: 50n,
      stakedBalance: 50n,
    });

    await expect(
      fetchWithdrawGasUnits({
        account: mockAccount,
        amount: 100n,
        client: mockClient,
        queryClient,
      }),
    ).rejects.toThrow("Insufficient staked balance");

    expect(estimateGas).not.toHaveBeenCalled();
  });
});
