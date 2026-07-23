import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DepositEvents } from "@vetro-protocol/gateway";
import { deposit } from "@vetro-protocol/gateway/actions";
import type { EventEmitter } from "events";
import type { TreasuryToken } from "pages/analytics/types";
import type { TokenWithGateway } from "types";
import { getReceivedAmount } from "utils/receipt";
import { type Address, isAddressEqual } from "viem";
import { useAccount } from "wagmi";

import { analyticsTreasuryQueryKey } from "./useAnalyticsTreasury";
import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { previewDepositQueryKey } from "./usePreviewDeposit";
import { treasuryReservesQueryKey } from "./useTreasuryReserves";

export const useDeposit = function ({
  amountIn,
  approveAmount,
  gatewayAddress,
  minPeggedTokenOut,
  onEmitter,
  peggedToken,
  tokenIn,
}: {
  amountIn: bigint;
  approveAmount?: bigint;
  gatewayAddress: Address;
  minPeggedTokenOut: bigint | undefined;
  onEmitter?: (emitter: EventEmitter<DepositEvents>) => void;
  peggedToken: TokenWithGateway;
  tokenIn: Address;
}) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const ethereumChain = useMainnet();
  const queryClient = useQueryClient();
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    ethereumChain.id,
  );

  const allowanceKey = allowanceQueryKey({
    owner: account,
    spender: gatewayAddress,
    token: { address: tokenIn, chainId: ethereumChain.id },
  });

  const tokenInBalanceQueryKey = tokenBalanceQueryKey(
    {
      address: tokenIn,
      chainId: ethereumChain.id,
    },
    account,
  );

  const treasuryReservesKey = treasuryReservesQueryKey({
    chainId: ethereumChain.id,
    gatewayAddress,
  });

  const analyticsTreasuryKey = analyticsTreasuryQueryKey(
    peggedToken.gatewayAddress,
  );

  const peggedTokenBalanceQueryKey = tokenBalanceQueryKey(peggedToken, account);

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }
      if (minPeggedTokenOut === undefined) {
        throw new Error("No preview available");
      }

      await ensureConnectedTo(ethereumChain.id);

      const { emitter, promise } = deposit(walletClient!, {
        amountIn,
        approveAmount,
        gatewayAddress,
        minPeggedTokenOut,
        receiver: account,
        tokenIn,
      });

      onEmitter?.(emitter);

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

        const mintedAmount =
          getReceivedAmount({ account, logs: receipt.logs }) ??
          minPeggedTokenOut;

        // optimistically deduce the deposited token, and increase PeggedToken balance
        queryClient.setQueryData(
          tokenInBalanceQueryKey,
          (old: bigint) => old - amountIn,
        );
        queryClient.setQueryData(
          peggedTokenBalanceQueryKey,
          (old: bigint) => old + mintedAmount,
        );
        // optimistically increase treasury reserve for the deposited token
        queryClient.setQueryData(
          treasuryReservesKey,
          (old: { amount: bigint; token: { address: Address } }[]) =>
            old?.map((reserve) =>
              isAddressEqual(reserve.token.address, tokenIn)
                ? { ...reserve, amount: reserve.amount + amountIn }
                : reserve,
            ),
        );
        // optimistically bump the analytics treasury allocation for tokenIn.
        // The API is indexer-backed and may lag, so this keeps the UI in
        // sync until the backend catches up.
        queryClient.setQueryData(
          analyticsTreasuryKey,
          (old: TreasuryToken[] | undefined) =>
            old?.map((item) =>
              isAddressEqual(item.tokenAddress as Address, tokenIn)
                ? {
                    ...item,
                    withdrawable: (
                      BigInt(item.withdrawable) + amountIn
                    ).toString(),
                  }
                : item,
            ),
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
        queryKey: peggedTokenBalanceQueryKey,
      });

      queryClient.invalidateQueries({
        queryKey: treasuryReservesKey,
      });

      queryClient.invalidateQueries({
        queryKey: analyticsTreasuryKey,
      });

      // Let's clear this query, as once the user inputs an amount
      // again, it has to be recalculated
      queryClient.removeQueries({
        queryKey: previewDepositQueryKey({
          amountIn,
          chainId: ethereumChain.id,
          gatewayAddress,
          tokenIn,
        }),
      });
    },
  });
};
