import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deposit } from "@vetro-protocol/earn/actions";
import { mainnet } from "networks/mainnet";
import type { TokenWithGateway } from "types";
import { type CostBases, bumpCostBasis } from "utils/costBasis";
import type { Address, Hash, TransactionReceipt } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount } from "wagmi";

import { costBasisQueryKey } from "./useCostBasis";
import { earnedAmountUsdQueryKey } from "./useEarnedAmountUsd";
import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { poolDepositsQueryKey } from "./usePoolDeposits";
import { stakedBalanceQueryKey } from "./useStakedBalance";
import { stakedUsdQueryKey } from "./useStakedUsd";

type DepositStatus =
  | "approve-failed"
  | "approved"
  | "approving"
  | "completed"
  | "deposit-failed"
  | "depositing";

type Variables = {
  approveAmount?: bigint;
  assets: bigint;
  pendingHash?: Hash;
  stakingVaultAddress: Address;
};

type Params = {
  onStatusChange?: (params: {
    status: DepositStatus;
    variables: Variables;
  }) => void;
  onTransactionHash?: (params: { hash: Hash; variables: Variables }) => void;
  peggedToken: TokenWithGateway;
};

export const useStakeDeposit = function ({
  onStatusChange,
  onTransactionHash,
  peggedToken,
}: Params) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();
  const { queryKey: nativeBalanceKey } = useNativeBalance(mainnet.id);
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    mainnet.id,
  );

  const peggedTokenBalanceKey = tokenBalanceQueryKey(peggedToken, account);

  const getVaultQueryKeys = (stakingVaultAddress: Address) => ({
    allowanceKey: allowanceQueryKey({
      owner: account,
      spender: stakingVaultAddress,
      token: { address: peggedToken.address, chainId: mainnet.id },
    }),
    poolDepositsKey: poolDepositsQueryKey({
      chainId: mainnet.id,
      stakingVaultAddress,
    }),
    sharesBalanceKey: tokenBalanceQueryKey(
      { address: stakingVaultAddress, chainId: mainnet.id },
      account,
    ),
    stakedKey: stakedBalanceQueryKey({
      account: account!,
      chainId: mainnet.id,
      stakingVaultAddress,
    }),
  });

  return useMutation({
    async mutationFn(variables: Variables) {
      const { approveAmount, assets, pendingHash, stakingVaultAddress } =
        variables;
      if (!account) {
        throw new Error("No account connected");
      }

      const { allowanceKey, poolDepositsKey, stakedKey } =
        getVaultQueryKeys(stakingVaultAddress);

      await ensureConnectedTo(mainnet.id);

      const handleDepositSucceeded = function (receipt: TransactionReceipt) {
        updateNativeBalanceAfterReceipt(receipt);
        onStatusChange?.({ status: "completed", variables });

        // Optimistically update balances
        queryClient.setQueryData(
          peggedTokenBalanceKey,
          (old: bigint | undefined) => (old !== undefined ? old - assets : old),
        );
        queryClient.setQueryData(stakedKey, (old: bigint | undefined) =>
          old !== undefined ? old + assets : old,
        );
        queryClient.setQueryData(poolDepositsKey, (old: bigint | undefined) =>
          old !== undefined ? old + assets : old,
        );

        queryClient.setQueryData(
          costBasisQueryKey(account),
          (old: CostBases | undefined) =>
            bumpCostBasis({ assets, costBases: old, stakingVaultAddress }),
        );
      };

      if (pendingHash) {
        onTransactionHash?.({ hash: pendingHash, variables });
        const pendingReceipt = await waitForTransactionReceipt(walletClient!, {
          hash: pendingHash,
        }).catch(() => undefined);
        if (!pendingReceipt) {
          onStatusChange?.({ status: "deposit-failed", variables });
          return;
        }
        if (pendingReceipt.status === "success") {
          handleDepositSucceeded(pendingReceipt);
          return;
        }
        updateNativeBalanceAfterReceipt(pendingReceipt);
      }

      const { emitter, promise } = deposit(walletClient!, {
        approveAmount,
        assets,
        receiver: account,
        token: peggedToken.address,
        vaultAddress: stakingVaultAddress,
      });

      emitter.on("user-signed-approval", function () {
        onStatusChange?.({ status: "approving", variables });
      });

      emitter.on("approve-transaction-succeeded", function () {
        onStatusChange?.({ status: "approved", variables });
      });

      emitter.on("user-signed-deposit", function (hash) {
        onTransactionHash?.({ hash, variables });
        onStatusChange?.({ status: "depositing", variables });
      });

      emitter.on("user-signing-approval-error", function () {
        onStatusChange?.({ status: "approve-failed", variables });
      });

      emitter.on(
        "approve-transaction-reverted",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange?.({ status: "approve-failed", variables });
        },
      );

      emitter.on(
        "approve-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          queryClient.invalidateQueries({
            queryKey: allowanceKey,
          });
        },
      );

      emitter.on("user-signing-deposit-error", function () {
        onStatusChange?.({ status: "deposit-failed", variables });
      });

      emitter.on("deposit-failed", function () {
        onStatusChange?.({ status: "deposit-failed", variables });
      });

      emitter.on("deposit-failed-validation", function () {
        onStatusChange?.({ status: "deposit-failed", variables });
      });

      emitter.on("unexpected-error", function () {
        onStatusChange?.({ status: "deposit-failed", variables });
      });

      emitter.on(
        "deposit-transaction-reverted",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange?.({ status: "deposit-failed", variables });
        },
      );

      emitter.on("deposit-transaction-succeeded", handleDepositSucceeded);

      await promise;
    },
    async onSettled(_data, _error, { stakingVaultAddress }) {
      const { allowanceKey, poolDepositsKey, sharesBalanceKey, stakedKey } =
        getVaultQueryKeys(stakingVaultAddress);

      queryClient.invalidateQueries({
        queryKey: allowanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: peggedTokenBalanceKey,
      });

      // Refetch (not just invalidate) shares: it feeds useStakedBalance.
      await queryClient.refetchQueries({ queryKey: sharesBalanceKey });

      queryClient.invalidateQueries({
        queryKey: stakedKey,
      });

      queryClient.invalidateQueries({
        queryKey: stakedUsdQueryKey({
          account,
          chainId: mainnet.id,
          stakingVaultAddress,
        }),
      });

      queryClient.invalidateQueries({
        queryKey: earnedAmountUsdQueryKey({
          account,
          chainId: mainnet.id,
          stakingVaultAddress,
        }),
      });

      queryClient.invalidateQueries({
        queryKey: poolDepositsKey,
      });
    },
  });
};
