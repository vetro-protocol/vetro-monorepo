import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { cancelWithdraw } from "@vetro-protocol/earn/actions";
import { exitTicketsQueryKey } from "pages/earn/hooks/useExitTickets";
import type { ExitTicket } from "pages/earn/types";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { stakedBalanceQueryKey } from "./useStakedBalance";

type CancelWithdrawStatus = "cancelling" | "completed" | "failed";

type Params = {
  assets: bigint;
  onStatusChange: (status: CancelWithdrawStatus) => void;
  onTransactionHash?: (hash: string) => void;
  requestId: bigint;
};

// TODO using the only staking vault address to simplify this PR
// we will handle multiple addresses in the next PR
const stakingVaultAddress = stakingVaultAddresses[0];

export const useCancelWithdraw = function ({
  assets,
  onStatusChange,
  onTransactionHash,
  requestId,
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
      });

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
