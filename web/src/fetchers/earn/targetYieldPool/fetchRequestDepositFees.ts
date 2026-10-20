import { tokenBalanceQueryOptions } from "@hemilabs/react-hooks/useTokenBalance";
import type { QueryClient } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { encodeRequestDeposit } from "@vetro-protocol/target-yield-earn/actions";
import { estimateApprovalGasUnits } from "fetchers/estimateApprovalGasUnits";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { getChainById } from "networks";
import {
  createErc20AllowanceStateOverride,
  createErc20BalanceStateOverride,
} from "utils/erc20StateOverride";
import { mergeStateOverrides } from "utils/stateOverride";
import type { Address, Client } from "viem";
import { estimateGas } from "viem/actions";

export const fetchRequestDepositFees = async function ({
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

  const [approvalGasUnits, requestDepositGasUnits] = await Promise.all([
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
      data: encodeRequestDeposit({
        assets: amount,
        controller: owner,
        owner,
      }),
      stateOverride: mergeStateOverrides(
        createErc20AllowanceStateOverride({
          owner,
          spender: stakingVaultAddress,
          token,
        }),
        amount > balance
          ? createErc20BalanceStateOverride({ balance: amount, owner, token })
          : [],
      ),
      to: stakingVaultAddress,
    }),
  ]);

  return fetchTotalNetworkFees({
    chain: getChainById(token.chainId),
    gasUnits: approvalGasUnits + requestDepositGasUnits,
    queryClient,
  });
};
