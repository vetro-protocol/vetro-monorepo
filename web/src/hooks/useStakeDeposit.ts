import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deposit } from "@vetro-protocol/earn/actions";
import type { TokenWithGateway } from "types";
import type { Address, TransactionReceipt } from "viem";
import { useAccount } from "wagmi";

import { analyticsTotalsQueryKey } from "./useAnalyticsTotals";
import { costBasisQueryKey } from "./useCostBasis";
import { earnedAmountUsdQueryKey } from "./useEarnedAmountUsd";
import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { poolDepositsQueryKey } from "./usePoolDeposits";
import { stakedBalanceQueryKey } from "./useStakedBalance";
import { totalStakedUsdQueryKey } from "./useTotalStakedUsd";

type DepositStatus =
  | "approve-failed"
  | "approved"
  | "approving"
  | "completed"
  | "deposit-failed"
  | "depositing";

type Params = {
  approveAmount?: bigint;
  assets: bigint;
  onStatusChange?: (status: DepositStatus) => void;
  onSuccess?: VoidFunction;
  onTransactionHash?: (hash: string) => void;
  peggedToken: TokenWithGateway;
  stakingVaultAddress: Address;
};

export const useStakeDeposit = function ({
  approveAmount,
  assets,
  onStatusChange,
  onSuccess,
  onTransactionHash,
  peggedToken,
  stakingVaultAddress,
}: Params) {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();
  const { queryKey: nativeBalanceKey } = useNativeBalance(chain.id);
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    chain.id,
  );

  const allowanceKey = allowanceQueryKey({
    owner: account,
    spender: stakingVaultAddress,
    token: { address: peggedToken.address, chainId: chain.id },
  });

  const peggedTokenBalanceKey = tokenBalanceQueryKey(peggedToken, account);

  const sharesBalanceKey = tokenBalanceQueryKey(
    { address: stakingVaultAddress, chainId: chain.id },
    account,
  );

  const stakedKey = stakedBalanceQueryKey({
    account: account!,
    chainId: chain.id,
    stakingVaultAddress,
  });

  const poolDepositsKey = poolDepositsQueryKey({
    chainId: chain.id,
    stakingVaultAddress,
  });

  const analyticsTotalsKey = analyticsTotalsQueryKey({
    chainId: chain.id,
    gatewayAddress: peggedToken.gatewayAddress,
  });

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }

      await ensureConnectedTo(chain.id);

      const { emitter, promise } = deposit(walletClient!, {
        approveAmount,
        assets,
        receiver: account,
        token: peggedToken.address,
        vaultAddress: stakingVaultAddress,
      });

      emitter.on("user-signed-approval", function () {
        onStatusChange?.("approving");
      });

      emitter.on("approve-transaction-succeeded", function () {
        onStatusChange?.("approved");
      });

      emitter.on("user-signed-deposit", function (hash) {
        onTransactionHash?.(hash);
        onStatusChange?.("depositing");
      });

      emitter.on("user-signing-approval-error", function () {
        onStatusChange?.("approve-failed");
      });

      emitter.on(
        "approve-transaction-reverted",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange?.("approve-failed");
        },
      );

      emitter.on(
        "approve-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          queryClient.invalidateQueries({
            queryKey: allowanceKey,
          });
        },
      );

      emitter.on("user-signing-deposit-error", function () {
        onStatusChange?.("deposit-failed");
      });

      emitter.on(
        "deposit-transaction-reverted",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange?.("deposit-failed");
        },
      );

      emitter.on(
        "deposit-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange?.("completed");
          onSuccess?.();

          // Optimistically update balances
          queryClient.setQueryData(
            peggedTokenBalanceKey,
            (old: bigint | undefined) =>
              old !== undefined ? old - assets : old,
          );
          queryClient.setQueryData(stakedKey, (old: bigint | undefined) =>
            old !== undefined ? old + assets : old,
          );
          queryClient.setQueryData(
            poolDepositsKey,
            (old: bigint | undefined) =>
              old !== undefined ? old + assets : old,
          );
        },
      );

      return promise;
    },
    async onSettled() {
      queryClient.invalidateQueries({
        queryKey: allowanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: peggedTokenBalanceKey,
      });

      // Refetch (not just invalidate) the queries that downstream fetchers
      // read via ensureQueryData: shares feed useStakedBalance, and cost
      // basis feeds fetchEarnedAmountUsd. Neither has a mounted observer,
      // so invalidation alone would leave them stale.
      await Promise.all([
        queryClient.refetchQueries({ queryKey: sharesBalanceKey }),
        queryClient.refetchQueries({
          queryKey: costBasisQueryKey(account),
        }),
      ]);

      queryClient.invalidateQueries({
        queryKey: stakedKey,
      });

      queryClient.invalidateQueries({
        queryKey: totalStakedUsdQueryKey({ account, chainId: chain.id }),
      });

      queryClient.invalidateQueries({
        queryKey: earnedAmountUsdQueryKey({ account, chainId: chain.id }),
      });

      queryClient.invalidateQueries({
        queryKey: poolDepositsKey,
      });

      queryClient.invalidateQueries({
        queryKey: analyticsTotalsKey,
      });
    },
  });
};
