import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getGatewayAddress, type RedeemEvents } from "@vetro/gateway";
import { redeem } from "@vetro/gateway/actions";
import type { EventEmitter } from "events";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { redeemRequestQueryKey } from "./useGetRedeemRequest";
import { useMainnet } from "./useMainnet";
import {
  previewRedeemQueryKey,
  previewRedeemTokenOptions,
} from "./usePreviewRedeem";
import { useRedeemDelay } from "./useRedeemDelay";
import { useVusd } from "./useVusd";

export const useRedeem = function ({
  approveAmount,
  onEmitter,
  peggedTokenIn,
  tokenOut,
}: {
  approveAmount?: bigint;
  onEmitter?: (emitter: EventEmitter<RedeemEvents>) => void;
  peggedTokenIn: bigint;
  tokenOut: Address;
}) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const ethereumChain = useMainnet();
  const { queryKey: nativeBalanceKey } = useNativeBalance(ethereumChain.id);
  const gatewayAddress = getGatewayAddress(ethereumChain.id);
  const queryClient = useQueryClient();

  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    ethereumChain.id,
  );

  const { data: redeemDelay } = useRedeemDelay();
  const { data: vusd } = useVusd();

  const hasDelay = !!redeemDelay;
  const requestQueryKey = redeemRequestQueryKey({
    address: account,
    chainId: ethereumChain.id,
  });

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

      onEmitter?.(emitter);

      if (!hasDelay) {
        // If the user is redeeming from the Gateway Vault where VUSD is locked
        // the VUSD is burned from this vault, so no approval step is required.
        // We don't need these events
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
      }

      emitter.on("redeem-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
      });

      emitter.on("redeem-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);

        if (hasDelay) {
          // if there's a delay, VUSD was burned from the Gateway vault
          // so the amount to redeem is reduced.
          queryClient.setQueryData(requestQueryKey, (old: [bigint, bigint]) => [
            old[0] - peggedTokenIn,
            old[1],
          ]);
        } else {
          // If there's no delay, the user is burning VUSD from their wallet
          queryClient.setQueryData(
            vusdBalanceQueryKey,
            (old: bigint) => old - peggedTokenIn,
          );
        }
        // In any case, the user ends up receiving the stablecoins converted from VUSD
        queryClient.setQueryData(
          tokenOutBalanceQueryKey,
          (old: bigint) => old + minAmountOut,
        );
      });

      return promise;
    },
    onSettled() {
      if (hasDelay) {
        queryClient.invalidateQueries({
          queryKey: requestQueryKey,
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: allowanceKey,
        });
        queryClient.invalidateQueries({
          queryKey: vusdBalanceQueryKey,
        });
      }
      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
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
