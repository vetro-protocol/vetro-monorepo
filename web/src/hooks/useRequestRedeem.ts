import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RequestRedeemEvents } from "@vetro/gateway";
import { requestRedeem } from "@vetro/gateway/actions";
import type { EventEmitter } from "events";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { useVusd } from "./useVusd";

export const useRequestRedeem = function ({
  approveAmount,
  onEmitter,
  peggedTokenAmount,
}: {
  approveAmount?: bigint;
  onEmitter?: (emitter: EventEmitter<RequestRedeemEvents>) => void;
  peggedTokenAmount: bigint;
}) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const ethereumChain = useMainnet();
  const { queryKey: nativeBalanceKey } = useNativeBalance(ethereumChain.id);
  const queryClient = useQueryClient();
  const { data: vusd } = useVusd();

  const vusdBalanceQueryKey = tokenBalanceQueryKey(vusd, account);

  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    ethereumChain.id,
  );

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }

      await ensureConnectedTo(ethereumChain.id);

      const { emitter, promise } = requestRedeem(walletClient!, {
        approveAmount,
        peggedTokenAmount,
      });

      emitter.on("request-redeem-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("request-redeem-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
        queryClient.setQueryData(
          vusdBalanceQueryKey,
          (old: bigint) => old - peggedTokenAmount,
        );
      });

      onEmitter?.(emitter);

      return promise;
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });
      queryClient.invalidateQueries({
        queryKey: vusdBalanceQueryKey,
      });
    },
  });
};
