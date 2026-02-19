import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gatewayAbi, type RequestRedeemEvents } from "@vetro/gateway";
import { requestRedeem } from "@vetro/gateway/actions";
import type { EventEmitter } from "events";
import { parseEventLogs } from "viem";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { redeemRequestQueryKey } from "./useGetRedeemRequest";
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
  const { address } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const ethereumChain = useMainnet();
  const { queryKey: nativeBalanceKey } = useNativeBalance(ethereumChain.id);
  const queryClient = useQueryClient();
  const { data: vusd } = useVusd();

  const vusdBalanceQueryKey = tokenBalanceQueryKey(vusd, address);

  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    ethereumChain.id,
  );

  return useMutation({
    async mutationFn() {
      if (!address) {
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
        // event is always emitted
        const events = parseEventLogs({
          abi: gatewayAbi,
          eventName: "RedeemRequested",
          logs: receipt.logs,
        });
        if (events?.[0]) {
          const [{ args }] = events;
          queryClient.setQueryData(
            redeemRequestQueryKey({
              address,
              chainId: ethereumChain.id,
            }),
            // event includes the updated amount and claimableAt
            [args.amount, args.claimableAt] as [bigint, bigint],
          );
        }
      });

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
