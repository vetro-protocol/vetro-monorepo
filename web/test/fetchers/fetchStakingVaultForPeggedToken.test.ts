import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { vaultAssetOptions } from "hooks/useVaultAsset";
import type { Address, Client } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { fetchStakingVaultForPeggedToken } from "../../src/fetchers/fetchStakingVaultForPeggedToken";
import { createTestQueryClient } from "../utils";

const client = { chain: mainnet } as unknown as Client;

const vusdAddress = "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3" as Address;

const seedVaultAssets = function (
  queryClient: ReturnType<typeof createTestQueryClient>,
  assets: Address[],
) {
  stakingVaultAddresses.forEach((vaultAddress, index) =>
    queryClient.setQueryData(
      vaultAssetOptions({ client, vaultAddress }).queryKey,
      assets[index],
    ),
  );
};

describe("fetchStakingVaultForPeggedToken", function () {
  it("returns the vault whose asset matches the pegged token", async function () {
    const queryClient = createTestQueryClient();
    seedVaultAssets(queryClient, [vusdAddress]);

    const result = await fetchStakingVaultForPeggedToken({
      client,
      peggedTokenAddress: vusdAddress,
      queryClient,
    });

    expect(result).toBe(stakingVaultAddresses[0]);
  });

  it("compares addresses case-insensitively", async function () {
    const queryClient = createTestQueryClient();
    seedVaultAssets(queryClient, [vusdAddress.toLowerCase() as Address]);

    const result = await fetchStakingVaultForPeggedToken({
      client,
      peggedTokenAddress: vusdAddress,
      queryClient,
    });

    expect(result).toBe(stakingVaultAddresses[0]);
  });

  it("throws when no vault matches the pegged token", async function () {
    const queryClient = createTestQueryClient();
    seedVaultAssets(queryClient, [vusdAddress]);

    const unknownPeggedToken =
      "0xdead000000000000000000000000000000000000" as Address;

    await expect(
      fetchStakingVaultForPeggedToken({
        client,
        peggedTokenAddress: unknownPeggedToken,
        queryClient,
      }),
    ).rejects.toThrow(/No staking vault found for pegged token/);
  });
});
