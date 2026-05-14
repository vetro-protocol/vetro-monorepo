import type { QueryClient } from "@tanstack/react-query";
import { stakingVaultAbi } from "@vetro-protocol/earn";
import { stakedBalanceQueryOptions } from "hooks/useStakedBalance";
import { canInstantWithdrawOptions } from "pages/earn/hooks/useCanInstantWithdraw";
import {
  type Address,
  type Client,
  erc4626Abi,
  encodeFunctionData,
} from "viem";
import { estimateGas } from "viem/actions";

/**
 * Estimates gas units for an earn withdraw. Reads the instant withdraw
 * status from the query cache and builds the appropriate calldata.
 * Throws if the amount exceeds the user's staked balance.
 */
export const fetchWithdrawGasUnits = async function ({
  account,
  amount,
  client,
  queryClient,
  stakingVaultAddress,
}: {
  account: Address;
  amount: bigint;
  client: Client;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}) {
  const chainId = client.chain!.id;

  const [canInstantWithdraw, stakedBalance] = await Promise.all([
    queryClient.ensureQueryData(
      canInstantWithdrawOptions({
        account,
        chainId,
        client,
        stakingVaultAddress,
      }),
    ),
    queryClient.ensureQueryData(
      stakedBalanceQueryOptions({
        account,
        chainId,
        client,
        queryClient,
        stakingVaultAddress,
      }),
    ),
  ]);

  if (amount > stakedBalance) {
    throw new Error("Insufficient staked balance");
  }

  const data = canInstantWithdraw
    ? encodeFunctionData({
        abi: erc4626Abi,
        args: [amount, account, account],
        functionName: "withdraw",
      })
    : encodeFunctionData({
        abi: stakingVaultAbi,
        args: [amount, account],
        functionName: "requestWithdraw",
      });

  return estimateGas(client, {
    account,
    data,
    to: stakingVaultAddress,
  });
};
