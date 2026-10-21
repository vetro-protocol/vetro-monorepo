import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { cancelDepositRequest } from "@vetro-protocol/target-yield-earn/actions";
import { emptyDepositRequest } from "fetchers/earn/targetYieldPool/fetchDepositRequest";
import { useEthereumWalletClient } from "hooks/useEthereumWalletClient";
import type { Address, TransactionReceipt } from "viem";
import { useAccount } from "wagmi";

import { depositRequestQueryKey } from "./useDepositRequest";
import { depositsQueryKey } from "./useDeposits";
import { epochQueryKey } from "./useEpoch";
import { useEpochId } from "./useEpochId";
import { useIsEntryWindowOpen } from "./useIsEntryWindowOpen";
import { maxRequestDepositQueryKey } from "./useMaxRequestDeposit";

export type CancelDepositRequestEmitter = ReturnType<
  typeof cancelDepositRequest
>["emitter"];

type Params = {
  assets: bigint;
  onEmitter?: (emitter: CancelDepositRequestEmitter) => void;
  peggedToken: Token;
  stakingVaultAddress: Address;
};

export const useCancelDepositRequest = function ({
  assets,
  onEmitter,
  peggedToken,
  stakingVaultAddress,
}: Params) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();

  const { data: epochId } = useEpochId(stakingVaultAddress);
  const { queryKey: nativeBalanceKey } = useNativeBalance(peggedToken.chainId);
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    peggedToken.chainId,
  );

  const isEntryWindowOpen = useIsEntryWindowOpen(stakingVaultAddress);

  const depositRequestKey = depositRequestQueryKey({
    controller: account,
    isEntryWindowOpen,
    stakingVaultAddress,
  });

  const peggedTokenBalanceKey = tokenBalanceQueryKey(peggedToken, account);

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }
      if (!walletClient) {
        throw new Error("No wallet client available");
      }

      await ensureConnectedTo(peggedToken.chainId);

      const { emitter, promise } = cancelDepositRequest(walletClient, {
        address: stakingVaultAddress,
        controller: account,
      });

      onEmitter?.(emitter);

      emitter.on(
        "cancel-deposit-request-transaction-reverted",
        updateNativeBalanceAfterReceipt,
      );

      emitter.on(
        "cancel-deposit-request-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);

          queryClient.setQueryData(depositRequestKey, emptyDepositRequest);
          queryClient.setQueryData(
            peggedTokenBalanceKey,
            (old: bigint | undefined) =>
              old !== undefined ? old + assets : old,
          );
        },
      );

      return promise;
    },
    async onSettled() {
      queryClient.invalidateQueries({ queryKey: nativeBalanceKey });
      queryClient.invalidateQueries({ queryKey: peggedTokenBalanceKey });
      queryClient.invalidateQueries({ queryKey: depositRequestKey });
      queryClient.invalidateQueries({
        queryKey: maxRequestDepositQueryKey({
          account,
          isEntryWindowOpen: true,
          stakingVaultAddress,
        }),
      });
      // Refetch (not just invalidate) the epoch: it feeds the deposits.
      await queryClient.refetchQueries({
        queryKey: epochQueryKey({ epochId, stakingVaultAddress }),
      });
      queryClient.invalidateQueries({
        queryKey: depositsQueryKey({ epochId, stakingVaultAddress }),
      });
    },
  });
};
