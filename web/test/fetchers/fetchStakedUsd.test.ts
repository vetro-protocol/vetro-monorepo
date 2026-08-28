import { knownTokens } from "@vetro-protocol/core";
import { pricesOptions } from "hooks/usePrices";
import { stakedBalanceQueryOptions } from "hooks/useStakedBalance";
import { vaultPeggedTokenQueryOptions } from "hooks/useVaultPeggedToken";
import type { Address, Client } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { fetchStakedUsd } from "../../src/fetchers/fetchStakedUsd";
import { createTestQueryClient } from "../utils";

const account = "0x0000000000000000000000000000000000000abc" as Address;
const client = { chain: mainnet } as unknown as Client;

const vault1 = "0x1111111111111111111111111111111111111111" as Address;
const vault2 = "0x2222222222222222222222222222222222222222" as Address;

const vusd = {
  ...knownTokens.find((token) => token.symbol === "VUSD")!,
  gatewayAddress: "0x0000000000000000000000000000000000000001" as Address,
};
const usdc = {
  ...knownTokens.find((token) => token.symbol === "USDC")!,
  gatewayAddress: "0x0000000000000000000000000000000000000002" as Address,
};

describe("fetchStakedUsd", function () {
  it("returns staked amount times price", async function () {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      vaultPeggedTokenQueryOptions({
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      vusd,
    );
    queryClient.setQueryData(
      stakedBalanceQueryOptions({
        account,
        chainId: mainnet.id,
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      10n * 10n ** 18n,
    );
    // VUSD's priceSymbol is USDT, so getTokenPrice looks up the USDT key.
    queryClient.setQueryData(pricesOptions({ client, queryClient }).queryKey, {
      USDT: "1",
    });

    const result = await fetchStakedUsd({
      account,
      client,
      queryClient,
      stakingVaultAddress: vault1,
    });

    expect(result).toBe(10);
  });

  it("uses the vault's own pegged token decimals and price", async function () {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      vaultPeggedTokenQueryOptions({
        client,
        queryClient,
        stakingVaultAddress: vault2,
      }).queryKey,
      usdc,
    );
    queryClient.setQueryData(
      stakedBalanceQueryOptions({
        account,
        chainId: mainnet.id,
        client,
        queryClient,
        stakingVaultAddress: vault2,
      }).queryKey,
      25n * 10n ** 6n,
    );
    queryClient.setQueryData(pricesOptions({ client, queryClient }).queryKey, {
      USDC: "1.1",
    } as Record<string, string>);

    const result = await fetchStakedUsd({
      account,
      client,
      queryClient,
      stakingVaultAddress: vault2,
    });

    // 25 USDC * $1.1 = 27.5
    expect(result).toBeCloseTo(27.5, 6);
  });

  it("returns 0 when the pegged token has no price entry", async function () {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      vaultPeggedTokenQueryOptions({
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      vusd,
    );
    queryClient.setQueryData(
      stakedBalanceQueryOptions({
        account,
        chainId: mainnet.id,
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      10n * 10n ** 18n,
    );
    queryClient.setQueryData(
      pricesOptions({ client, queryClient }).queryKey,
      {},
    );

    const result = await fetchStakedUsd({
      account,
      client,
      queryClient,
      stakingVaultAddress: vault1,
    });

    expect(result).toBe(0);
  });

  it("throws when the client has no chain", async function () {
    const clientWithoutChain = {} as Client;

    await expect(
      fetchStakedUsd({
        account,
        client: clientWithoutChain,
        queryClient: createTestQueryClient(),
        stakingVaultAddress: vault1,
      }),
    ).rejects.toThrow(/Client is missing a chain/);
  });
});
