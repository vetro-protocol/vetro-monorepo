import { QueryClient } from "@tanstack/react-query";
import {
  getCancelableRedeemRequest,
  getClaimableRedeemRequest,
  getPendingRedeemRequest,
} from "@vetro-protocol/target-yield-earn/actions";
import type { Address, Client } from "viem";
import { convertToAssets, maxRedeem, maxWithdraw } from "viem-erc4626/actions";
import { describe, expect, it, vi } from "vitest";

import { fetchRedeemRequest } from "../../src/fetchers/earn/targetYieldPool/fetchRedeemRequest";

vi.mock("@vetro-protocol/target-yield-earn/actions", () => ({
  getCancelableRedeemRequest: vi.fn(),
  getClaimableRedeemRequest: vi.fn(),
  getPendingRedeemRequest: vi.fn(),
}));

vi.mock("viem-erc4626/actions", () => ({
  convertToAssets: vi.fn(),
  maxRedeem: vi.fn(),
  maxWithdraw: vi.fn(),
}));

const client = {} as Client;
const controller: Address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const stakingVaultAddress: Address =
  "0x1234567890123456789012345678901234567890";

function mockReads({
  cancelableShares = 0n,
  claimableAssets = 0n,
  claimableShares = 0n,
  maxRedeemShares = 0n,
  pendingShares = 0n,
}: {
  cancelableShares?: bigint;
  claimableAssets?: bigint;
  claimableShares?: bigint;
  maxRedeemShares?: bigint;
  pendingShares?: bigint;
}) {
  vi.mocked(getCancelableRedeemRequest).mockResolvedValue(cancelableShares);
  vi.mocked(getClaimableRedeemRequest).mockResolvedValue(claimableShares);
  vi.mocked(getPendingRedeemRequest).mockResolvedValue(pendingShares);
  vi.mocked(maxRedeem).mockResolvedValue(maxRedeemShares);
  vi.mocked(maxWithdraw).mockResolvedValue(claimableAssets);
}

describe("fetchRedeemRequest", function () {
  it("reads a pending request and prices its shares", async function () {
    mockReads({ cancelableShares: 300n, pendingShares: 300n });
    vi.mocked(convertToAssets).mockResolvedValue(330n);

    const result = await fetchRedeemRequest({
      client,
      controller,
      queryClient: new QueryClient(),
      stakingVaultAddress,
    });

    expect(result).toEqual({
      cancelableShares: 300n,
      claimableAssets: 0n,
      claimableShares: 0n,
      maxRedeemShares: 0n,
      pendingAssets: 330n,
      pendingShares: 300n,
    });
    const params = { address: stakingVaultAddress, controller };
    expect(getCancelableRedeemRequest).toHaveBeenCalledWith(client, params);
    expect(getClaimableRedeemRequest).toHaveBeenCalledWith(client, params);
    expect(getPendingRedeemRequest).toHaveBeenCalledWith(client, params);
    expect(maxRedeem).toHaveBeenCalledWith(client, {
      address: stakingVaultAddress,
      owner: controller,
    });
    expect(maxWithdraw).toHaveBeenCalledWith(client, {
      address: stakingVaultAddress,
      owner: controller,
    });
    expect(convertToAssets).toHaveBeenCalledExactlyOnceWith(client, {
      address: stakingVaultAddress,
      shares: 300n,
    });
  });

  it("reads a claimable request without pricing pending shares", async function () {
    mockReads({
      claimableAssets: 550n,
      claimableShares: 500n,
      maxRedeemShares: 500n,
    });

    const result = await fetchRedeemRequest({
      client,
      controller,
      queryClient: new QueryClient(),
      stakingVaultAddress,
    });

    expect(result).toEqual({
      cancelableShares: 0n,
      claimableAssets: 550n,
      claimableShares: 500n,
      maxRedeemShares: 500n,
      pendingAssets: 0n,
      pendingShares: 0n,
    });
    expect(convertToAssets).not.toHaveBeenCalled();
  });
});
