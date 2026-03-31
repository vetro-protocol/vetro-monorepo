import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type CancelRedeemRequestEvents } from "@vetro-protocol/gateway";
import { cancelRedeemRequest } from "@vetro-protocol/gateway/actions";
import type { EventEmitter } from "events";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { redeemRequestQueryKey } from "./useGetRedeemRequest";
import { useMainnet } from "./useMainnet";
import { useVusd } from "./useVusd";

export const useCancelRedeemRequest = function ({
  onEmitter,
  redeemableAmount,
}: {
  onEmitter?: (emitter: EventEmitter<CancelRedeemRequestEvents>) => void;
  redeemableAmount: bigint;
}) {
  const { address } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const ethereumChain = useMainnet();
  const { queryKey: nativeBalanceKey } = useNativeBalance(ethereumChain.id);
  const queryClient = useQueryClient();
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    ethereumChain.id,
  );
  const { data: vusd } = useVusd();

  const vusdBalanceQueryKey = tokenBalanceQueryKey(vusd, address);

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error("No account connected");
      }

      await ensureConnectedTo(ethereumChain.id);

      const { emitter, promise } = cancelRedeemRequest(walletClient!);

      emitter.on("cancel-redeem-request-transaction-reverted", (receipt) =>
        updateNativeBalanceAfterReceipt(receipt),
      );

      emitter.on(
        "cancel-redeem-request-transaction-succeeded",
        function (receipt) {
          updateNativeBalanceAfterReceipt(receipt);
          // VUSD balance increases as these are transferred back to the user
          queryClient.setQueryData(
            vusdBalanceQueryKey,
            (old: bigint) => old + redeemableAmount,
          );
          // The redeem request is cleared
          queryClient.setQueryData(
            redeemRequestQueryKey({
              address,
              chainId: ethereumChain.id,
            }),
            [0n, 0n] as [bigint, bigint],
          );
        },
      );

      onEmitter?.(emitter);

      return promise;
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });
      queryClient.invalidateQueries({
        queryKey: redeemRequestQueryKey({
          address,
          chainId: ethereumChain.id,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: vusdBalanceQueryKey,
      });
    },
  });
};
