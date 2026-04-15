import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RedeemEvents } from "@vetro-protocol/gateway";
import { redeem } from "@vetro-protocol/gateway/actions";
import type { EventEmitter } from "events";
import type { TokenWithGateway } from "types";
import { type Address, erc20Abi, isAddressEqual, parseEventLogs } from "viem";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { redeemRequestQueryKey } from "./useGetRedeemRequest";
import { redeemRequestsQueryKey } from "./useGetRedeemRequests";
import { useMainnet } from "./useMainnet";
import { maxWithdrawQueryKey } from "./useMaxWithdraw";
import {
  previewRedeemQueryKey,
  previewRedeemTokenOptions,
} from "./usePreviewRedeem";
import { redeemDelayOptions } from "./useRedeemDelay";
import { treasuryReservesQueryKey } from "./useTreasuryReserves";

export const useRedeem = function ({
  approveAmount,
  onEmitter,
  peggedToken,
  peggedTokenIn,
  tokenOut,
}: {
  approveAmount?: bigint;
  onEmitter?: (emitter: EventEmitter<RedeemEvents>) => void;
  peggedToken: TokenWithGateway;
  peggedTokenIn: bigint;
  tokenOut: Address;
}) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const ethereumChain = useMainnet();
  const { queryKey: nativeBalanceKey } = useNativeBalance(ethereumChain.id);
  const queryClient = useQueryClient();

  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    ethereumChain.id,
  );

  const requestQueryKey = redeemRequestQueryKey({
    address: account,
    chainId: ethereumChain.id,
    gatewayAddress: peggedToken.gatewayAddress,
  });

  const requestsQueryKey = redeemRequestsQueryKey({
    address: account,
    chainId: ethereumChain.id,
  });

  const allowanceKey = allowanceQueryKey({
    owner: account,
    spender: peggedToken.gatewayAddress,
    token: peggedToken,
  });

  const peggedTokenBalanceQueryKey = tokenBalanceQueryKey(peggedToken, account);

  const treasuryReservesKey = treasuryReservesQueryKey({
    chainId: ethereumChain.id,
    gatewayAddress: peggedToken.gatewayAddress,
  });

  const tokenOutBalanceQueryKey = tokenBalanceQueryKey(
    {
      address: tokenOut,
      chainId: ethereumChain.id,
    },
    account,
  );

  const maxWithdrawKey = maxWithdrawQueryKey({
    chainId: ethereumChain.id,
    gatewayAddress: peggedToken.gatewayAddress,
    tokenOut,
  });

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }
      await ensureConnectedTo(ethereumChain.id);

      const [minAmountOut, hasDelay] = await Promise.all([
        queryClient.ensureQueryData(
          previewRedeemTokenOptions({
            chainId: ethereumChain.id,
            client: walletClient!,
            gatewayAddress: peggedToken.gatewayAddress,
            peggedTokenIn,
            tokenOut,
          }),
        ),
        queryClient
          .ensureQueryData(
            redeemDelayOptions({
              account,
              chainId: ethereumChain.id,
              client: walletClient,
              gatewayAddress: peggedToken.gatewayAddress,
              queryClient,
            }),
          )
          .then((redeemDelay) => redeemDelay > 0n),
      ]);

      const { emitter, promise } = redeem(walletClient!, {
        approveAmount,
        gatewayAddress: peggedToken.gatewayAddress,
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

        // Parse the actual redeemed amount from the Transfer event
        const transferLogs = parseEventLogs({
          abi: erc20Abi,
          eventName: "Transfer",
          logs: receipt.logs,
        });
        const actualAmount =
          transferLogs.find((log) =>
            isAddressEqual(log.args.from, peggedToken.gatewayAddress),
          )?.args.value ?? minAmountOut;

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
            peggedTokenBalanceQueryKey,
            (old: bigint) => old - peggedTokenIn,
          );
        }
        // In any case, the user ends up receiving the stablecoins converted from VUSD
        queryClient.setQueryData(
          tokenOutBalanceQueryKey,
          (old: bigint) => old + actualAmount,
        );
        // optimistically decrease treasury reserve for the redeemed token
        queryClient.setQueryData(
          treasuryReservesKey,
          (old: { amount: bigint; token: { address: Address } }[]) =>
            old?.map((reserve) =>
              isAddressEqual(reserve.token.address, tokenOut)
                ? { ...reserve, amount: reserve.amount - actualAmount }
                : reserve,
            ),
        );
        // optimistically decrease max withdraw for the redeemed token
        queryClient.setQueryData(
          maxWithdrawKey,
          (old: bigint) => old - actualAmount,
        );
      });

      return promise;
    },
    async onSettled() {
      if (!account || !walletClient) {
        return;
      }
      const hasDelay = await queryClient.ensureQueryData(
        redeemDelayOptions({
          account,
          chainId: ethereumChain.id,
          client: walletClient,
          gatewayAddress: peggedToken.gatewayAddress,
          queryClient,
        }),
      );
      if (hasDelay) {
        queryClient.invalidateQueries({
          queryKey: requestQueryKey,
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: allowanceKey,
        });
        queryClient.invalidateQueries({
          queryKey: peggedTokenBalanceQueryKey,
        });
      }
      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });
      queryClient.invalidateQueries({
        queryKey: tokenOutBalanceQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: treasuryReservesKey,
      });
      queryClient.invalidateQueries({
        queryKey: maxWithdrawKey,
      });
      queryClient.invalidateQueries({
        queryKey: requestsQueryKey,
      });

      // Let's clear this query, as once the user inputs an amount
      // again, it has to be recalculated
      queryClient.removeQueries({
        queryKey: previewRedeemQueryKey({
          chainId: ethereumChain.id,
          gatewayAddress: peggedToken.gatewayAddress,
          peggedTokenIn,
          tokenOut,
        }),
      });
    },
  });
};
