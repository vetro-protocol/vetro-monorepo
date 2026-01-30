import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { deposit } from "@vetro/gateway/actions";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { useHemi } from "./useHemi";
import { useHemiWalletClient } from "./useHemiWalletClient";
import {
  previewDepositQueryKey,
  previewDepositTokenOptions,
} from "./usePreviewDeposit";
import { useVusd } from "./useVusd";

export const useDeposit = function ({
  amountIn,
  tokenIn,
}: {
  amountIn: bigint;
  tokenIn: Address;
}) {
  const { address: account } = useAccount();
  const { data: walletClient } = useHemiWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const hemi = useHemi();
  const gatewayAddress = getGatewayAddress(hemi.id);
  const queryClient = useQueryClient();
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    hemi.id,
  );
  const { data: vusd } = useVusd();

  const allowanceKey = allowanceQueryKey({
    owner: account,
    spender: gatewayAddress,
    token: { address: tokenIn, chainId: hemi.id },
  });

  const tokenInBalanceQueryKey = tokenBalanceQueryKey(
    {
      address: tokenIn,
      chainId: hemi.id,
    },
    account,
  );

  const vusdBalanceQueryKey = tokenBalanceQueryKey(vusd, account);

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }

      await ensureConnectedTo(hemi.id);

      const minPeggedTokenOut = await queryClient.ensureQueryData(
        previewDepositTokenOptions({
          amountIn,
          chainId: hemi.id,
          client: walletClient!,
          gatewayAddress,
          tokenIn,
        }),
      );

      const { emitter, promise } = deposit(walletClient!, {
        amountIn,
        minPeggedTokenOut,
        receiver: account,
        tokenIn,
      });

      emitter.on("approve-transaction-reverted", function (receipt) {
        queryClient.invalidateQueries({
          queryKey: allowanceKey,
        });
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("approve-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
        queryClient.invalidateQueries({
          queryKey: allowanceKey,
        });
      });
      emitter.on("deposit-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("deposit-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);

        // optimistically deduce the deposited token, and increase vusd balance
        queryClient.setQueryData(
          tokenInBalanceQueryKey,
          (old: bigint) => old - amountIn,
        );
        queryClient.setQueryData(
          vusdBalanceQueryKey,
          (old: bigint) => old + minPeggedTokenOut,
        );
      });

      return promise;
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: allowanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: tokenInBalanceQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: vusdBalanceQueryKey,
      });

      // Let's clear this query, as once the user inputs an amount
      // again, it has to be recalculated
      queryClient.removeQueries({
        queryKey: previewDepositQueryKey({
          amountIn,
          chainId: hemi.id,
          gatewayAddress,
          tokenIn,
        }),
      });
    },
  });
};
