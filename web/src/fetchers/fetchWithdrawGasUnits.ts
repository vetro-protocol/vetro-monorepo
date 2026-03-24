import type { QueryClient } from "@tanstack/react-query";
import { getStakingVaultAddress, stakingVaultAbi } from "@vetro/earn";
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
 */
export const fetchWithdrawGasUnits = async function ({
  account,
  amount,
  client,
  queryClient,
}: {
  account: Address;
  amount: bigint;
  client: Client;
  queryClient: QueryClient;
}) {
  const chainId = client.chain!.id;
  const stakingVaultAddress = getStakingVaultAddress(chainId);

  const canInstantWithdraw = await queryClient.ensureQueryData(
    canInstantWithdrawOptions({
      account,
      chainId,
      client,
    }),
  );

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
