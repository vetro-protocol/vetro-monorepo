import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelWithdraw } from "@vetro-protocol/earn/actions";
import { exitTicketsQueryKey } from "pages/earn/hooks/useExitTickets";
import type { ExitTicket } from "pages/earn/types";
import type { TokenWithGateway } from "types";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { analyticsStakedQueryKey } from "./useAnalyticsStaked";
import { costBasisQueryKey } from "./useCostBasis";
import { earnedAmountUsdQueryKey } from "./useEarnedAmountUsd";
import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { poolDepositsQueryKey } from "./usePoolDeposits";
import { stakedBalanceQueryKey } from "./useStakedBalance";
import { totalStakedUsdQueryKey } from "./useTotalStakedUsd";

type CancelWithdrawStatus = "cancelling" | "completed" | "failed";

type Params = {
  assets: bigint;
  onStatusChange: (status: CancelWithdrawStatus) => void;
  onTransactionHash?: (hash: string) => void;
  peggedToken: TokenWithGateway;
  requestId: bigint;
  stakingVaultAddress: Address;
};

export const useCancelWithdraw = function ({
  assets,
  onStatusChange,
  onTransactionHash,
  peggedToken,
  requestId,
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

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }

      await ensureConnectedTo(chain.id);

      const { emitter, promise } = cancelWithdraw(walletClient!, {
        requestId,
        vaultAddress: stakingVaultAddress,
      });

      emitter.on("user-signed-cancel-withdraw", function (hash) {
        onTransactionHash?.(hash);
        onStatusChange("cancelling");
      });

      emitter.on("user-signing-cancel-withdraw-error", function () {
        onStatusChange("failed");
      });

      emitter.on("cancel-withdraw-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
        onStatusChange("failed");
      });

      emitter.on("cancel-withdraw-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
        onStatusChange("completed");

        // Optimistically remove ticket from cache
        queryClient.setQueryData(
          exitTicketsQueryKey(account),
          (old: ExitTicket[] | undefined) =>
            (old ?? []).filter((t) => t.requestId !== requestId.toString()),
        );

        // Optimistically add assets back to staked balance
        queryClient.setQueryData(stakedKey, (old: bigint | undefined) =>
          old !== undefined ? old + assets : old,
        );
        // Optimistically add assets back to pool deposits
        queryClient.setQueryData(poolDepositsKey, (old: bigint | undefined) =>
          old !== undefined ? old + assets : old,
        );
      });

      return promise;
    },
    async onSettled() {
      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
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

      queryClient.refetchQueries({
        queryKey: analyticsStakedQueryKey(peggedToken.gatewayAddress),
      });
    },
  });
};
