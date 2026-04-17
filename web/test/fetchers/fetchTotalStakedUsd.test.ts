import { peggedTokensByGatewayQueryOptions } from "hooks/usePeggedTokensByGateway";
import { pricesOptions } from "hooks/usePrices";
import { stakedBalanceQueryOptions } from "hooks/useStakedBalance";
import { vaultPeggedTokenQueryOptions } from "hooks/useVaultPeggedToken";
import type { TokenWithGateway } from "types";
import { knownTokens } from "utils/tokenList";
import type { Address, Client } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { fetchTotalStakedUsd } from "../../src/fetchers/fetchTotalStakedUsd";
import { createTestQueryClient } from "../utils";

const account = "0x0000000000000000000000000000000000000abc" as Address;
const client = { chain: mainnet } as unknown as Client;

const vault1 = "0x1111111111111111111111111111111111111111" as Address;
const vault2 = "0x2222222222222222222222222222222222222222" as Address;
const gateway1 = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;
const gateway2 = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Address;

const vusd = knownTokens.find((token) => token.symbol === "VUSD")!;
const usdc = knownTokens.find((token) => token.symbol === "USDC")!;

const vusdWithGateway: TokenWithGateway = {
  ...vusd,
  gatewayAddress: gateway1,
};
const usdcWithGateway: TokenWithGateway = {
  ...usdc,
  gatewayAddress: gateway2,
};

describe("fetchTotalStakedUsd", function () {
  it("returns staked amount times price for a single vault", async function () {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      peggedTokensByGatewayQueryOptions({ client, queryClient }).queryKey,
      { [gateway1]: vusdWithGateway },
    );
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
    queryClient.setQueryData(
      pricesOptions({ client, gatewayAddress: gateway1, queryClient }).queryKey,
      { USDT: "1" },
    );

    const result = await fetchTotalStakedUsd({
      account,
      client,
      queryClient,
      stakingVaultAddresses: [vault1],
    });

    expect(result).toBe(10);
  });

  it("sums staked values across multiple vaults on different gateways", async function () {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      peggedTokensByGatewayQueryOptions({ client, queryClient }).queryKey,
      {
        [gateway1]: vusdWithGateway,
        [gateway2]: usdcWithGateway,
      },
    );
    queryClient.setQueryData(
      vaultPeggedTokenQueryOptions({
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      vusd,
    );
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
        stakingVaultAddress: vault1,
      }).queryKey,
      5n * 10n ** 18n,
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
    queryClient.setQueryData(
      pricesOptions({ client, gatewayAddress: gateway1, queryClient }).queryKey,
      { USDT: "1" } as Record<string, string>,
    );
    queryClient.setQueryData(
      pricesOptions({ client, gatewayAddress: gateway2, queryClient }).queryKey,
      { USDC: "1.1" } as Record<string, string>,
    );

    const result = await fetchTotalStakedUsd({
      account,
      client,
      queryClient,
      stakingVaultAddresses: [vault1, vault2],
    });

    // 5 VUSD * $1 + 25 USDC * $1.1 = 32.5
    expect(result).toBe(32.5);
  });

  it("contributes 0 when the pegged token has no price entry", async function () {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      peggedTokensByGatewayQueryOptions({ client, queryClient }).queryKey,
      { [gateway1]: vusdWithGateway } as Record<Address, TokenWithGateway>,
    );
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
      pricesOptions({ client, gatewayAddress: gateway1, queryClient }).queryKey,
      {},
    );

    const result = await fetchTotalStakedUsd({
      account,
      client,
      queryClient,
      stakingVaultAddresses: [vault1],
    });

    expect(result).toBe(0);
  });

  it("throws when a vault's pegged token has no matching gateway", async function () {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      peggedTokensByGatewayQueryOptions({ client, queryClient }).queryKey,
      {},
    );
    queryClient.setQueryData(
      vaultPeggedTokenQueryOptions({
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      vusd,
    );

    await expect(
      fetchTotalStakedUsd({
        account,
        client,
        queryClient,
        stakingVaultAddresses: [vault1],
      }),
    ).rejects.toThrow(/No gateway found for pegged token/);
  });

  it("throws when the client has no chain", async function () {
    const clientWithoutChain = {} as Client;

    await expect(
      fetchTotalStakedUsd({
        account,
        client: clientWithoutChain,
        queryClient: createTestQueryClient(),
        stakingVaultAddresses: [vault1],
      }),
    ).rejects.toThrow(/Client is missing a chain/);
  });
});
