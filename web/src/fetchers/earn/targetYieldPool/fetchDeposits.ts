import type { QueryClient } from "@tanstack/react-query";
import { pricesOptions } from "hooks/usePrices";
import { vaultPeggedTokenQueryOptions } from "hooks/useVaultPeggedToken";
import { tokenAmountToUsd } from "utils/currency";
import { type Address, type Client, parseUnits } from "viem";

// TODO: read the pool deposits and the epoch deposit cap from
// `@vetro-protocol/target-yield-earn` once the vault is deployed. Both are
// denominated in the pool's deposit pegged token, like the contract returns
// them. See https://github.com/vetro-protocol/vetro-monorepo/issues/646
const depositsByEpochId: Record<
  string,
  { deposits: string; maxDeposits: string }
> = {
  "1": {
    // Most likely be replaced with getEpoch(id).deposits
    deposits: "4200000",
    // Most likely be replaced with maxEpochDeposits(id)
    maxDeposits: "5000000",
  },
};

// `decimals` only exists to scale the mocked amounts the way the contract
// already would; the real read returns them in the token's own units.
const readDeposits = async function ({
  decimals,
  epochId,
}: {
  decimals: number;
  epochId: bigint;
}) {
  const { deposits, maxDeposits } = depositsByEpochId[epochId.toString()];

  return {
    deposits: parseUnits(deposits, decimals),
    maxDeposits: parseUnits(maxDeposits, decimals),
  };
};

export const fetchDeposits = async function ({
  client,
  epochId,
  queryClient,
  stakingVaultAddress,
}: {
  client: Client;
  epochId: bigint;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}) {
  const [peggedToken, prices] = await Promise.all([
    queryClient.ensureQueryData(
      vaultPeggedTokenQueryOptions({
        client,
        queryClient,
        stakingVaultAddress,
      }),
    ),
    queryClient.ensureQueryData(pricesOptions({ client, queryClient })),
  ]);

  const { deposits, maxDeposits } = await readDeposits({
    decimals: peggedToken.decimals,
    epochId,
  });

  return {
    maxDepositsUsd: tokenAmountToUsd({
      amount: maxDeposits,
      prices,
      token: peggedToken,
    }),
    totalDepositsUsd: tokenAmountToUsd({
      amount: deposits,
      prices,
      token: peggedToken,
    }),
  };
};
