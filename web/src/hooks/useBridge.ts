import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SendEvents } from "@vetro-protocol/bridge";
import { send } from "@vetro-protocol/bridge/actions";
import type { EventEmitter } from "events";
import type { Address, Chain } from "viem";
import { useAccount, useWalletClient } from "wagmi";

import { previewBridgeQueryKey } from "./usePreviewBridge";

export const useBridge = function ({
  amount,
  approveAmount,
  destinationChainId,
  oftAddress,
  onEmitter,
  sourceChainId,
  sourceTokenAddress,
}: {
  amount: bigint;
  approveAmount?: bigint;
  destinationChainId: Chain["id"];
  oftAddress: Address;
  onEmitter?: (emitter: EventEmitter<SendEvents>) => void;
  sourceChainId: Chain["id"];
  sourceTokenAddress: Address;
}) {
  const { address: account } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: sourceChainId });
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();
  const updateNativeBalanceAfterReceipt =
    useUpdateNativeBalanceAfterReceipt(sourceChainId);

  const allowanceKey = allowanceQueryKey({
    owner: account,
    spender: oftAddress,
    token: { address: sourceTokenAddress, chainId: sourceChainId },
  });

  const sourceBalanceKey = tokenBalanceQueryKey(
    { address: sourceTokenAddress, chainId: sourceChainId },
    account,
  );

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }
      if (!walletClient) {
        throw new Error("Wallet client is not ready");
      }

      await ensureConnectedTo(sourceChainId);

      const { emitter, promise } = send(walletClient, {
        amount,
        approveAmount,
        destinationChainId,
        oftAddress,
        recipient: account,
      });

      onEmitter?.(emitter);

      emitter.on("approve-transaction-reverted", function (receipt) {
        queryClient.invalidateQueries({ queryKey: allowanceKey });
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("approve-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
        queryClient.invalidateQueries({ queryKey: allowanceKey });
      });
      emitter.on("send-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("send-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);

        // optimistically deduct the bridged amount from the source balance
        queryClient.setQueryData(
          sourceBalanceKey,
          (old: bigint) => old - amount,
        );
      });

      return promise;
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: allowanceKey,
      });
      queryClient.invalidateQueries({
        queryKey: sourceBalanceKey,
      });

      // Clear the cached fee quote — once the user inputs a new amount it
      // has to be recalculated.
      queryClient.removeQueries({
        queryKey: previewBridgeQueryKey({
          amount,
          destinationChainId,
          oftAddress,
          recipient: account!,
          sourceChainId,
        }),
      });
    },
  });
};
