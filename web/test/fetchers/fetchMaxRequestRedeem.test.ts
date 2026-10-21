import {
  getMaxMint,
  getMaxRequestRedeem,
} from "@vetro-protocol/target-yield-earn/actions";
import type { Address, Client } from "viem";
import { describe, expect, it, vi } from "vitest";

import { fetchMaxRequestRedeem } from "../../src/fetchers/earn/targetYieldPool/fetchMaxRequestRedeem";

vi.mock("@vetro-protocol/target-yield-earn/actions", () => ({
  getMaxMint: vi.fn(),
  getMaxRequestRedeem: vi.fn(),
}));

const account: Address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const client = {} as Client;
const stakingVaultAddress: Address =
  "0x1234567890123456789012345678901234567890";

function mockReads({
  accountMax,
  claimableShares,
  vaultMax = 0n,
}: {
  accountMax: bigint;
  claimableShares: bigint;
  vaultMax?: bigint;
}) {
  vi.mocked(getMaxMint).mockResolvedValue(claimableShares);
  vi.mocked(getMaxRequestRedeem).mockImplementation((_, { owner }) =>
    Promise.resolve(owner === stakingVaultAddress ? vaultMax : accountMax),
  );
}

describe("fetchMaxRequestRedeem", function () {
  it("returns the max request redeem when there is no claimable deposit", async function () {
    mockReads({ accountMax: 500n, claimableShares: 0n });

    await expect(
      fetchMaxRequestRedeem({ account, client, stakingVaultAddress }),
    ).resolves.toBe(500n);
    expect(getMaxRequestRedeem).toHaveBeenCalledExactlyOnceWith(client, {
      address: stakingVaultAddress,
      controller: account,
      owner: account,
    });
    expect(getMaxMint).toHaveBeenCalledExactlyOnceWith(client, {
      address: stakingVaultAddress,
      controller: account,
    });
  });

  it("adds the claimable deposit shares when the account can request", async function () {
    mockReads({ accountMax: 500n, claimableShares: 300n });

    await expect(
      fetchMaxRequestRedeem({ account, client, stakingVaultAddress }),
    ).resolves.toBe(800n);
    expect(getMaxRequestRedeem).toHaveBeenCalledOnce();
  });

  it("returns the claimable deposit shares when the account holds no shares and the request is not blocked", async function () {
    mockReads({ accountMax: 0n, claimableShares: 300n, vaultMax: 1_000n });

    await expect(
      fetchMaxRequestRedeem({ account, client, stakingVaultAddress }),
    ).resolves.toBe(300n);
    expect(getMaxRequestRedeem).toHaveBeenLastCalledWith(client, {
      address: stakingVaultAddress,
      controller: account,
      owner: stakingVaultAddress,
    });
  });

  it("returns 0 when the request is blocked, also with a claimable deposit", async function () {
    mockReads({ accountMax: 0n, claimableShares: 300n, vaultMax: 0n });

    await expect(
      fetchMaxRequestRedeem({ account, client, stakingVaultAddress }),
    ).resolves.toBe(0n);
  });
});
