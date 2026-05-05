import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import { costBasisQueryOptions } from "hooks/useCostBasis";
import { pricesOptions } from "hooks/usePrices";
import { stakedBalanceQueryOptions } from "hooks/useStakedBalance";
import { vaultPeggedTokenQueryOptions } from "hooks/useVaultPeggedToken";
import { knownTokens } from "utils/tokenList";
import type { Address, Client } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { fetchEarnedAmountUsd } from "../../src/fetchers/fetchEarnedAmountUsd";
import { createTestQueryClient } from "../utils";

const account = "0x0000000000000000000000000000000000000abc" as Address;
const client = { chain: mainnet } as unknown as Client;

const vault1 = "0x1111111111111111111111111111111111111111" as Address;
const vault2 = "0x2222222222222222222222222222222222222222" as Address;

const vusd = {
  ...knownTokens.find((token) => token.symbol === "VUSD")!,
  gatewayAddress: "0x0000000000000000000000000000000000000001" as Address,
};
const vetBtc = {
  ...knownTokens.find((token) => token.symbol === "vetBTC")!,
  gatewayAddress: "0x0000000000000000000000000000000000000002" as Address,
};

describe("fetchEarnedAmountUsd", function () {
  it("returns the unrealized P&L (current - cost basis) times price", async function () {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      vaultPeggedTokenQueryOptions({
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      vusd,
    );
    // 10 shares.
    queryClient.setQueryData(
      tokenBalanceQueryOptions({
        account,
        client,
        token: { address: vault1, chainId: mainnet.id },
      }).queryKey,
      10n * 10n ** 18n,
    );
    // currentAssets = 12 vUSD (price went up).
    queryClient.setQueryData(
      stakedBalanceQueryOptions({
        account,
        chainId: mainnet.id,
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      12n * 10n ** 18n,
    );
    // costBasis = 10 vUSD → earned = 2 vUSD.
    queryClient.setQueryData(
      costBasisQueryOptions({ address: account }).queryKey,
      { [vault1]: 10n * 10n ** 18n } as Record<Address, bigint>,
    );
    queryClient.setQueryData(pricesOptions({ client, queryClient }).queryKey, {
      USDT: "1",
    });

    const result = await fetchEarnedAmountUsd({
      account,
      client,
      queryClient,
      stakingVaultAddresses: [vault1],
    });

    expect(result).toBe(2);
  });

  it("returns a negative number when current value is below cost basis", async function () {
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
      tokenBalanceQueryOptions({
        account,
        client,
        token: { address: vault1, chainId: mainnet.id },
      }).queryKey,
      10n * 10n ** 18n,
    );
    // currentAssets = 8 vUSD, costBasis = 10 vUSD → loss of 2 vUSD.
    queryClient.setQueryData(
      stakedBalanceQueryOptions({
        account,
        chainId: mainnet.id,
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      8n * 10n ** 18n,
    );
    queryClient.setQueryData(
      costBasisQueryOptions({ address: account }).queryKey,
      { [vault1]: 10n * 10n ** 18n } as Record<Address, bigint>,
    );
    queryClient.setQueryData(pricesOptions({ client, queryClient }).queryKey, {
      USDT: "1",
    });

    const result = await fetchEarnedAmountUsd({
      account,
      client,
      queryClient,
      stakingVaultAddresses: [vault1],
    });

    expect(result).toBe(-2);
  });

  it("sums P&L across multiple vaults", async function () {
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
      vaultPeggedTokenQueryOptions({
        client,
        queryClient,
        stakingVaultAddress: vault2,
      }).queryKey,
      vetBtc,
    );
    queryClient.setQueryData(
      tokenBalanceQueryOptions({
        account,
        client,
        token: { address: vault1, chainId: mainnet.id },
      }).queryKey,
      5n * 10n ** 18n,
    );
    queryClient.setQueryData(
      tokenBalanceQueryOptions({
        account,
        client,
        token: { address: vault2, chainId: mainnet.id },
      }).queryKey,
      2n * 10n ** 18n,
    );
    queryClient.setQueryData(
      stakedBalanceQueryOptions({
        account,
        chainId: mainnet.id,
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      6n * 10n ** 18n,
    );
    queryClient.setQueryData(
      stakedBalanceQueryOptions({
        account,
        chainId: mainnet.id,
        client,
        queryClient,
        stakingVaultAddress: vault2,
      }).queryKey,
      (21n * 10n ** 18n) / 10n,
    );
    queryClient.setQueryData(
      costBasisQueryOptions({ address: account }).queryKey,
      {
        [vault1]: 5n * 10n ** 18n,
        [vault2]: 2n * 10n ** 18n,
      } as Record<Address, bigint>,
    );
    queryClient.setQueryData(pricesOptions({ client, queryClient }).queryKey, {
      USDT: "1",
      WBTC: "60000",
    } as Record<string, string>);

    const result = await fetchEarnedAmountUsd({
      account,
      client,
      queryClient,
      stakingVaultAddresses: [vault1, vault2],
    });

    // vault1: 6 - 5 = 1 vUSD * $1 = $1
    // vault2: 2.1 - 2 = 0.1 vetBTC * $60_000 = $6000
    expect(result).toBeCloseTo(6001, 6);
  });

  it("contributes 0 when shares are 0", async function () {
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
      tokenBalanceQueryOptions({
        account,
        client,
        token: { address: vault1, chainId: mainnet.id },
      }).queryKey,
      0n,
    );
    queryClient.setQueryData(
      stakedBalanceQueryOptions({
        account,
        chainId: mainnet.id,
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      0n,
    );
    queryClient.setQueryData(
      costBasisQueryOptions({ address: account }).queryKey,
      { [vault1]: 0n } as Record<Address, bigint>,
    );
    queryClient.setQueryData(pricesOptions({ client, queryClient }).queryKey, {
      USDT: "1",
    });

    const result = await fetchEarnedAmountUsd({
      account,
      client,
      queryClient,
      stakingVaultAddresses: [vault1],
    });

    expect(result).toBe(0);
  });

  it("contributes 0 when cost basis is missing for a vault with shares", async function () {
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
      tokenBalanceQueryOptions({
        account,
        client,
        token: { address: vault1, chainId: mainnet.id },
      }).queryKey,
      10n * 10n ** 18n,
    );
    queryClient.setQueryData(
      stakedBalanceQueryOptions({
        account,
        chainId: mainnet.id,
        client,
        queryClient,
        stakingVaultAddress: vault1,
      }).queryKey,
      12n * 10n ** 18n,
    );
    // Subgraph not yet synced — API returns 0n for the vault.
    queryClient.setQueryData(
      costBasisQueryOptions({ address: account }).queryKey,
      { [vault1]: 0n } as Record<Address, bigint>,
    );
    queryClient.setQueryData(pricesOptions({ client, queryClient }).queryKey, {
      USDT: "1",
    });

    const result = await fetchEarnedAmountUsd({
      account,
      client,
      queryClient,
      stakingVaultAddresses: [vault1],
    });

    expect(result).toBe(0);
  });

  it("throws when the client has no chain", async function () {
    const clientWithoutChain = {} as Client;

    await expect(
      fetchEarnedAmountUsd({
        account,
        client: clientWithoutChain,
        queryClient: createTestQueryClient(),
        stakingVaultAddresses: [vault1],
      }),
    ).rejects.toThrow(/Client is missing a chain/);
  });
});
