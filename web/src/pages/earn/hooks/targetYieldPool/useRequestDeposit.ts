import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestDeposit } from "@vetro-protocol/target-yield-earn/actions";
import type { DepositRequest } from "fetchers/earn/targetYieldPool/fetchDepositRequest";
import { useEthereumWalletClient } from "hooks/useEthereumWalletClient";
import { stakedBalanceQueryKey } from "hooks/useStakedBalance";
import { stakedUsdQueryKey } from "hooks/useStakedUsd";
import type { TokenWithGateway } from "types";
import type { Address, TransactionReceipt } from "viem";
import { useAccount } from "wagmi";

import { applyRequestDeposit } from "./applyRequestDeposit";
import { depositRequestQueryKey } from "./useDepositRequest";
import { depositsQueryKey } from "./useDeposits";
import { type Epoch, epochQueryKey } from "./useEpoch";
import { useEpochId } from "./useEpochId";
import { maxRequestDepositQueryKey } from "./useMaxRequestDeposit";
import { redeemRequestQueryKey } from "./useRedeemRequest";

export type RequestDepositEmitter = ReturnType<
  typeof requestDeposit
>["emitter"];

type Params = {
  approveAmount?: bigint;
  assets: bigint;
  onEmitter?: (emitter: RequestDepositEmitter) => void;
  peggedToken: TokenWithGateway;
  stakingVaultAddress: Address;
};

export const useRequestDeposit = function ({
  approveAmount,
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

  const allowanceKey = allowanceQueryKey({
    owner: account,
    spender: stakingVaultAddress,
    token: { address: peggedToken.address, chainId: peggedToken.chainId },
  });

  const depositRequestKey = depositRequestQueryKey({
    controller: account,
    stakingVaultAddress,
  });

  const epochKey = epochQueryKey({ epochId, stakingVaultAddress });

  const maxRequestDepositKey = maxRequestDepositQueryKey({
    account,
    isEntryWindowOpen: true,
    stakingVaultAddress,
  });

  const peggedTokenBalanceKey = tokenBalanceQueryKey(peggedToken, account);

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

      const { emitter, promise } = requestDeposit(walletClient, {
        address: stakingVaultAddress,
        approveAmount,
        assets,
        controller: account,
        owner: account,
      });

      onEmitter?.(emitter);

      emitter.on(
        "approve-transaction-reverted",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
        },
      );

      emitter.on(
        "approve-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          queryClient.invalidateQueries({ queryKey: allowanceKey });
        },
      );

      emitter.on(
        "request-deposit-transaction-reverted",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
        },
      );

      emitter.on(
        "request-deposit-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);

          queryClient.setQueryData(
            peggedTokenBalanceKey,
            (old: bigint | undefined) =>
              old !== undefined ? old - assets : old,
          );
          queryClient.setQueryData(
            depositRequestKey,
            (old: DepositRequest | undefined) =>
              applyRequestDeposit({ assets, depositRequest: old }),
          );
          queryClient.setQueryData(
            maxRequestDepositKey,
            (old: bigint | undefined) =>
              old !== undefined ? old - assets : old,
          );
          queryClient.setQueryData(epochKey, (old: Epoch | undefined) =>
            old !== undefined
              ? { ...old, deposits: old.deposits + assets }
              : old,
          );
        },
      );

      return promise;
    },
    onMutate() {
      const depositRequest =
        queryClient.getQueryData<DepositRequest>(depositRequestKey);
      return {
        mayClaimShares:
          depositRequest === undefined || depositRequest.claimableAssets > 0n,
      };
    },
    async onSettled(_data, _error, _variables, context) {
      queryClient.invalidateQueries({ queryKey: allowanceKey });
      queryClient.invalidateQueries({ queryKey: nativeBalanceKey });
      queryClient.invalidateQueries({ queryKey: peggedTokenBalanceKey });
      queryClient.invalidateQueries({ queryKey: depositRequestKey });
      queryClient.invalidateQueries({
        queryKey: redeemRequestQueryKey({
          controller: account,
          stakingVaultAddress,
        }),
      });
      queryClient.invalidateQueries({ queryKey: maxRequestDepositKey });
      queryClient.invalidateQueries({ queryKey: epochKey });
      queryClient.invalidateQueries({
        queryKey: depositsQueryKey({ epochId, stakingVaultAddress }),
      });

      if (!context?.mayClaimShares) {
        return;
      }

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
  });
};
