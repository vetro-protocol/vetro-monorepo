import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claimDeposit } from "@vetro-protocol/target-yield-earn/actions";
import { emptyDepositRequest } from "fetchers/earn/targetYieldPool/fetchDepositRequest";
import { useEthereumWalletClient } from "hooks/useEthereumWalletClient";
import { stakedBalanceQueryKey } from "hooks/useStakedBalance";
import { stakedUsdQueryKey } from "hooks/useStakedUsd";
import { getReceivedAmount } from "utils/receipt";
import { type Address, maxUint256, type TransactionReceipt } from "viem";
import { useAccount } from "wagmi";

import { depositRequestQueryKey } from "./useDepositRequest";
import { useIsEntryWindowOpen } from "./useIsEntryWindowOpen";
import { maxRequestRedeemQueryKey } from "./useMaxRequestRedeem";

export type ClaimDepositEmitter = ReturnType<typeof claimDeposit>["emitter"];

type Params = {
  chainId: number;
  onEmitter?: (emitter: ClaimDepositEmitter) => void;
  stakingVaultAddress: Address;
};

export const useClaimDeposit = function ({
  chainId,
  onEmitter,
  stakingVaultAddress,
}: Params) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();

  const { queryKey: nativeBalanceKey } = useNativeBalance(chainId);
  const updateNativeBalanceAfterReceipt =
    useUpdateNativeBalanceAfterReceipt(chainId);

  const isEntryWindowOpen = useIsEntryWindowOpen(stakingVaultAddress);

  const depositRequestKey = depositRequestQueryKey({
    controller: account,
    isEntryWindowOpen,
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

      const { emitter, promise } = claimDeposit(walletClient, {
        address: stakingVaultAddress,
        assets: maxUint256,
        controller: account,
      });

      onEmitter?.(emitter);

      emitter.on(
        "claim-deposit-transaction-reverted",
        updateNativeBalanceAfterReceipt,
      );

      emitter.on(
        "claim-deposit-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);

          const shares = getReceivedAmount({ account, logs: receipt.logs });

          queryClient.setQueryData(depositRequestKey, emptyDepositRequest);
          queryClient.setQueryData(
            sharesBalanceKey,
            (old: bigint | undefined) =>
              old !== undefined && shares !== undefined ? old + shares : old,
          );
        },
      );

      return promise;
    },
    async onSettled() {
      queryClient.invalidateQueries({ queryKey: nativeBalanceKey });
      queryClient.invalidateQueries({ queryKey: depositRequestKey });
      queryClient.invalidateQueries({
        queryKey: maxRequestRedeemQueryKey({
          account,
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
