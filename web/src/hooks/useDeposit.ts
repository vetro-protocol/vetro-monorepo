import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type DepositEvents, getGatewayAddress } from "@vetro-protocol/gateway";
import { deposit } from "@vetro-protocol/gateway/actions";
import type { EventEmitter } from "events";
import { type Address, isAddressEqual } from "viem";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import {
  previewDepositQueryKey,
  previewDepositTokenOptions,
} from "./usePreviewDeposit";
import { treasuryReservesQueryKey } from "./useTreasuryReserves";
import { useVusd } from "./useVusd";

export const useDeposit = function ({
  amountIn,
  approveAmount,
  onEmitter,
  tokenIn,
}: {
  amountIn: bigint;
  approveAmount?: bigint;
  onEmitter?: (emitter: EventEmitter<DepositEvents>) => void;
  tokenIn: Address;
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

  const vusdBalanceQueryKey = tokenBalanceQueryKey(vusd, account);

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }

      await ensureConnectedTo(ethereumChain.id);

      const minPeggedTokenOut = await queryClient.ensureQueryData(
        previewDepositTokenOptions({
          amountIn,
          chainId: ethereumChain.id,
          client: walletClient!,
          gatewayAddress,
          tokenIn,
        }),
      );

      const { emitter, promise } = deposit(walletClient!, {
        amountIn,
        approveAmount,
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

        // optimistically deduce the deposited token, and increase vusd balance
        queryClient.setQueryData(
          tokenInBalanceQueryKey,
          (old: bigint) => old - amountIn,
        );
        queryClient.setQueryData(
          vusdBalanceQueryKey,
          (old: bigint) => old + minPeggedTokenOut,
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

      queryClient.invalidateQueries({
        queryKey: treasuryReservesKey,
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
