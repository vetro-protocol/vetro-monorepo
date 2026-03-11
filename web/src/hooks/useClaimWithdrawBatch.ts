import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import { claimWithdrawBatch } from "@vetro/earn/actions";
import { exitTicketsQueryKey } from "pages/earn/hooks/useExitTickets";
import type { ExitTicket } from "pages/earn/types";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { stakedBalanceQueryKey } from "./useStakedBalance";

type ClaimWithdrawBatchStatus = "claiming" | "completed" | "failed";

type Params = {
  onStatusChange: (status: ClaimWithdrawBatchStatus) => void;
  onTransactionHash?: (hash: string) => void;
  requestIds: bigint[];
};

export const useClaimWithdrawBatch = function ({
  onStatusChange,
  onTransactionHash,
  requestIds,
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

  const requestIdStrings = requestIds.map((id) => id.toString());

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }

      await ensureConnectedTo(chain.id);

      const { emitter, promise } = claimWithdrawBatch(walletClient!, {
        receiver: account,
        requestIds,
      });

      emitter.on("user-signed-claim-withdraw-batch", function (hash) {
        onTransactionHash?.(hash);
        onStatusChange("claiming");
      });

      emitter.on("user-signing-claim-withdraw-batch-error", function () {
        onStatusChange("failed");
      });

      emitter.on(
        "claim-withdraw-batch-transaction-reverted",
        function (receipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange("failed");
        },
      );

      emitter.on(
        "claim-withdraw-batch-transaction-succeeded",
        function (receipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange("completed");

          // Optimistically mark all claimed tickets as withdrawn
          queryClient.setQueryData(
            exitTicketsQueryKey(account),
            (old: ExitTicket[] | undefined) =>
              (old ?? []).map((t) =>
                requestIdStrings.includes(t.requestId)
                  ? { ...t, claimTxHash: receipt.transactionHash }
                  : t,
              ),
          );
        },
      );

      return promise;
    },
    async onSettled() {
      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });

      await queryClient.invalidateQueries({
        queryKey: sharesBalanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: stakedKey,
      });
    },
  });
};
