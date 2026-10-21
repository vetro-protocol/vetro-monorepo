import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { requestRedeem } from "@vetro-protocol/target-yield-earn/actions";
import type { DepositRequest } from "fetchers/earn/targetYieldPool/fetchDepositRequest";
import { useEthereumWalletClient } from "hooks/useEthereumWalletClient";
import { stakedBalanceQueryKey } from "hooks/useStakedBalance";
import { stakedUsdQueryKey } from "hooks/useStakedUsd";
import type { Address, TransactionReceipt } from "viem";
import { useAccount } from "wagmi";

import { depositRequestQueryKey } from "./useDepositRequest";
import { useIsEntryWindowOpen } from "./useIsEntryWindowOpen";
import { maxRequestRedeemQueryKey } from "./useMaxRequestRedeem";
import { redeemRequestQueryKey } from "./useRedeemRequest";

export type RequestExitEmitter = ReturnType<typeof requestRedeem>["emitter"];

type Params = {
  onEmitter?: (emitter: RequestExitEmitter) => void;
  peggedToken: Token;
  shares: bigint;
  stakingVaultAddress: Address;
};

export const useRequestExit = function ({
  onEmitter,
  peggedToken,
  shares,
  stakingVaultAddress,
}: Params) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();

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

  const maxRequestRedeemKey = maxRequestRedeemQueryKey({
    account,
    isOpenToExit: true,
    stakingVaultAddress,
  });

  const peggedTokenBalanceKey = tokenBalanceQueryKey(peggedToken, account);

  const redeemRequestKey = redeemRequestQueryKey({
    controller: account,
    isOpenToExit: true,
    stakingVaultAddress,
  });

  const sharesBalanceKey = tokenBalanceQueryKey(
    { address: stakingVaultAddress, chainId: peggedToken.chainId },
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

      await ensureConnectedTo(peggedToken.chainId);

      const { emitter, promise } = requestRedeem(walletClient, {
        address: stakingVaultAddress,
        controller: account,
        owner: account,
        shares,
      });

      onEmitter?.(emitter);

      let successReceipt: TransactionReceipt | undefined;

      emitter.on(
        "request-redeem-transaction-reverted",
        updateNativeBalanceAfterReceipt,
      );
      emitter.on(
        "request-redeem-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          successReceipt = receipt;
        },
      );

      await promise;
      return successReceipt;
    },
    onMutate() {
      const depositRequest =
        queryClient.getQueryData<DepositRequest>(depositRequestKey);
      return {
        mayClaimShares:
          depositRequest === undefined || depositRequest.claimableAssets > 0n,
        shares,
      };
    },
    async onSettled() {
      queryClient.invalidateQueries({ queryKey: nativeBalanceKey });
      queryClient.invalidateQueries({ queryKey: peggedTokenBalanceKey });
      queryClient.invalidateQueries({ queryKey: depositRequestKey });
      queryClient.invalidateQueries({ queryKey: redeemRequestKey });
      queryClient.invalidateQueries({ queryKey: maxRequestRedeemKey });

      // Refetch (not just invalidate) shares: it feeds useStakedBalance.
      await queryClient.refetchQueries({ queryKey: sharesBalanceKey });

      queryClient.invalidateQueries({
        queryKey: stakedBalanceQueryKey({
          account: account!,
          chainId: peggedToken.chainId,
          stakingVaultAddress,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: stakedUsdQueryKey({
          account,
          chainId: peggedToken.chainId,
          stakingVaultAddress,
        }),
      });
    },
    onSuccess(successReceipt, _variables, context) {
      if (!successReceipt || context.mayClaimShares) {
        return;
      }

      const subtractShares = (old: bigint | undefined) =>
        old !== undefined ? old - context.shares : old;

      queryClient.setQueryData(sharesBalanceKey, subtractShares);
      queryClient.setQueryData(maxRequestRedeemKey, subtractShares);
    },
  });
};
