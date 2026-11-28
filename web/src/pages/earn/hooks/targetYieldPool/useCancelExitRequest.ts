import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelRedeemRequest } from "@vetro-protocol/target-yield-earn/actions";
import { emptyRedeemRequest } from "fetchers/earn/targetYieldPool/fetchRedeemRequest";
import { useEthereumWalletClient } from "hooks/useEthereumWalletClient";
import { stakedBalanceQueryKey } from "hooks/useStakedBalance";
import { stakedUsdQueryKey } from "hooks/useStakedUsd";
import type { Address, TransactionReceipt } from "viem";
import { useAccount } from "wagmi";

import { useIsOpenToExit } from "./useIsOpenToExit";
import { maxRequestRedeemQueryKey } from "./useMaxRequestRedeem";
import { redeemRequestQueryKey } from "./useRedeemRequest";

export type CancelExitRequestEmitter = ReturnType<
  typeof cancelRedeemRequest
>["emitter"];

type Params = {
  chainId: number;
  onEmitter?: (emitter: CancelExitRequestEmitter) => void;
  shares: bigint;
  stakingVaultAddress: Address;
};

export const useCancelExitRequest = function ({
  chainId,
  onEmitter,
  shares,
  stakingVaultAddress,
}: Params) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();

  const { queryKey: nativeBalanceKey } = useNativeBalance(chainId);
  const updateNativeBalanceAfterReceipt =
    useUpdateNativeBalanceAfterReceipt(chainId);

  const { data: isOpenToExit } = useIsOpenToExit(stakingVaultAddress);

  const redeemRequestKey = redeemRequestQueryKey({
    controller: account,
    isOpenToExit,
    stakingVaultAddress,
  });

  const sharesBalanceKey = tokenBalanceQueryKey(
    { address: stakingVaultAddress, chainId },
    account,
  );

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }
      if (!walletClient) {
        throw new Error("No wallet client available");
      }

      await ensureConnectedTo(chainId);

      const { emitter, promise } = cancelRedeemRequest(walletClient, {
        address: stakingVaultAddress,
        controller: account,
      });

      onEmitter?.(emitter);

      emitter.on(
        "cancel-redeem-request-transaction-reverted",
        updateNativeBalanceAfterReceipt,
      );

      emitter.on(
        "cancel-redeem-request-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);

          queryClient.setQueryData(redeemRequestKey, emptyRedeemRequest);
          queryClient.setQueryData(
            sharesBalanceKey,
            (old: bigint | undefined) =>
              old !== undefined ? old + shares : old,
          );
        },
      );

      return promise;
    },
    async onSettled() {
      queryClient.invalidateQueries({ queryKey: nativeBalanceKey });
      queryClient.invalidateQueries({ queryKey: redeemRequestKey });
      queryClient.invalidateQueries({
        queryKey: maxRequestRedeemQueryKey({
          account,
          isOpenToExit,
          stakingVaultAddress,
        }),
      });

      // Refetch (not just invalidate) shares: it feeds useStakedBalance.
      await queryClient.refetchQueries({ queryKey: sharesBalanceKey });

      queryClient.invalidateQueries({
        queryKey: stakedBalanceQueryKey({
          account: account!,
          chainId,
          stakingVaultAddress,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: stakedUsdQueryKey({
          account,
          chainId,
          stakingVaultAddress,
        }),
      });
    },
  });
};
