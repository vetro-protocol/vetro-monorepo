import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { redeem } from "@vetro/gateway/actions";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import {
  previewRedeemQueryKey,
  previewRedeemTokenOptions,
} from "./usePreviewRedeem";
import { useVusd } from "./useVusd";

export const useRedeem = function ({
  approveAmount,
  peggedTokenIn,
  tokenOut,
}: {
  approveAmount?: bigint;
  peggedTokenIn: bigint;
  tokenOut: Address;
}) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const ethereumChain = useMainnet();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);
  const queryClient = useQueryClient();

  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    ethereumChain.id,
  );

  const { data: vusd } = useVusd();

  const allowanceKey = allowanceQueryKey({
    owner: account,
    spender: gatewayAddress,
    token: vusd,
  });

  const vusdBalanceQueryKey = tokenBalanceQueryKey(vusd, account);

  const tokenOutBalanceQueryKey = tokenBalanceQueryKey(
    {
      address: tokenOut,
      chainId: ethereumChain.id,
    },
    account,
  );

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }
      await ensureConnectedTo(ethereumChain.id);

      const minAmountOut = await queryClient.ensureQueryData(
        previewRedeemTokenOptions({
          chainId: ethereumChain.id,
          client: walletClient!,
          gatewayAddress,
          peggedTokenIn,
          tokenOut,
        }),
      );

      const { emitter, promise } = redeem(walletClient!, {
        approveAmount,
        minAmountOut,
        peggedTokenIn,
        receiver: account,
        tokenOut,
      });

      emitter.on("approve-transaction-reverted", function (receipt) {
        queryClient.invalidateQueries({
          queryKey: allowanceKey,
        });
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("approve-transaction-succeeded", function (receipt) {
        queryClient.invalidateQueries({
          queryKey: allowanceKey,
        });
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("redeem-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("redeem-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);

        // optimistically deduce the vusd balance, and increase the token out one
        queryClient.setQueryData(
          vusdBalanceQueryKey,
          (old: bigint) => old - peggedTokenIn,
        );
        queryClient.setQueryData(
          tokenOutBalanceQueryKey,
          (old: bigint) => old + minAmountOut,
        );
      });

      return promise;
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: allowanceKey,
      });
      queryClient.invalidateQueries({
        queryKey: vusdBalanceQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: tokenOutBalanceQueryKey,
      });

      // Let's clear this query, as once the user inputs an amount
      // again, it has to be recalculated
      queryClient.removeQueries({
        queryKey: previewRedeemQueryKey({
          chainId: ethereumChain.id,
          gatewayAddress,
          peggedTokenIn,
          tokenOut,
        }),
      });
    },
  });
};
