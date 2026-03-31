import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import type { QueryClient } from "@tanstack/react-query";
import { getStakingVaultAddress, stakingVaultAbi } from "@vetro-protocol/earn";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import { type Address, type Client, encodeFunctionData } from "viem";
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
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  client: Client;
  owner: Address;
  queryClient: QueryClient;
  token: Token;
}) {
  const chainId = client.chain!.id;
  const stakingVaultAddress = getStakingVaultAddress(chainId);

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
      data: encodeFunctionData({
        abi: stakingVaultAbi,
        args: [amount, owner],
        functionName: "deposit",
      }),
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
