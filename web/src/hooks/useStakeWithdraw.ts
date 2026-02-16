import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStakingVaultAddress, stakingVaultAbi } from "@vetro/earn";
import { requestWithdraw } from "@vetro/earn/actions";
import { exitTicketsQueryKey } from "pages/earn/hooks/useExitTickets";
import type { ExitTicket } from "pages/earn/types";
import { type TransactionReceipt, parseEventLogs } from "viem";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { stakedBalanceQueryKey } from "./useStakedBalance";

type WithdrawStatus = "completed" | "request-failed" | "requesting";

type Params = {
  assets: bigint;
  onStatusChange?: (status: WithdrawStatus) => void;
  onSuccess?: VoidFunction;
};

export const useStakeWithdraw = function ({
  assets,
  onStatusChange,
  onSuccess,
}: Params) {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);
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

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }

      await ensureConnectedTo(chain.id);

      const { emitter, promise } = requestWithdraw(walletClient!, {
        assets,
        owner: account,
      });

      emitter.on("user-signed-request-withdraw", function () {
        onStatusChange?.("requesting");
      });

      emitter.on("user-signing-request-withdraw-error", function () {
        onStatusChange?.("request-failed");
      });

      emitter.on(
        "request-withdraw-transaction-reverted",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange?.("request-failed");
        },
      );

      emitter.on(
        "request-withdraw-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange?.("completed");
          onSuccess?.();

          // Optimistically update staked balance
          queryClient.setQueryData(stakedKey, (old: bigint | undefined) =>
            old !== undefined ? old - assets : old,
          );

          // Optimistically add exit ticket to cache
          const logs = parseEventLogs({
            abi: stakingVaultAbi,
            eventName: "WithdrawRequested",
            logs: receipt.logs,
          });

          if (logs.length > 0) {
            const { args } = logs[0];
            const ticket: ExitTicket = {
              assets: args.assets.toString(),
              claimableAt: args.claimableAt.toString(),
              owner: args.owner,
              requestId: args.requestId.toString(),
              requestTxHash: receipt.transactionHash,
              shares: args.shares.toString(),
            };

            queryClient.setQueryData(
              exitTicketsQueryKey(account),
              (old: ExitTicket[] | undefined) => [ticket, ...(old ?? [])],
            );
          }
        },
      );

      return promise;
    },
    async onSettled() {
      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });

      // Shares must be refetched before staked balance, because
      // useStakedBalance uses ensureQueryData to read shares from cache
      await queryClient.invalidateQueries({
        queryKey: sharesBalanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: stakedKey,
      });

      queryClient.invalidateQueries({
        queryKey: exitTicketsQueryKey(account),
      });
    },
  });
};
