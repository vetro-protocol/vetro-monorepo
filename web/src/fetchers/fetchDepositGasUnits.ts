import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import type { QueryClient } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { encodeDeposit } from "@vetro-protocol/earn/actions";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import { type Address, type Client } from "viem";
import { estimateGas } from "viem/actions";

import { estimateApprovalGasUnits } from "./estimateApprovalGasUnits";

/**
 * Estimates gas units for an earn deposit. Returns the total gas units
 * for the whole flow (approval + deposit).
 * Throws if the amount exceeds the user's token balance.
 */
export const fetchDepositGasUnits = async function ({
  amount,
  approveAmount,
  client,
  owner,
  queryClient,
  stakingVaultAddress,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  client: Client;
  owner: Address;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
  token: Token;
}) {
  const balance = await queryClient.ensureQueryData(
    tokenBalanceQueryOptions({
      account: owner,
      client,
      token,
    }),
  );

  if (amount > balance) {
    throw new Error("Insufficient token balance");
  }

  const [approvalGas, depositGas] = await Promise.all([
    estimateApprovalGasUnits({
      amount,
      approveAmount,
      client,
      owner,
      queryClient,
      spender: stakingVaultAddress,
      token,
    }),
    estimateGas(client, {
      account: owner,
      data: encodeDeposit({ assets: amount, receiver: owner }),
      stateOverride: createErc20AllowanceStateOverride({
        owner,
        spender: stakingVaultAddress,
        token,
      }),
      to: stakingVaultAddress,
    }),
  ]);

  return approvalGas + depositGas;
};
