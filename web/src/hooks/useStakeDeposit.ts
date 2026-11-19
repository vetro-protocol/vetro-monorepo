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
import {
  type Address,
  type Hash,
  type TransactionReceipt,
  isAddressEqual,
} from "viem";
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
  account: Address;
  approveAmount?: bigint;
  assets: bigint;
  peggedToken: TokenWithGateway;
  pendingHash?: Hash;
  stakingVaultAddress: Address;
};

type Params = {
  onStatusChange?: (params: {
    status: DepositStatus;
    variables: Variables;
  }) => void;
  onTransactionHash?: (params: { hash: Hash; variables: Variables }) => void;
};

export const useStakeDeposit = function ({
  onStatusChange,
  onTransactionHash,
}: Params) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();
  const { queryKey: nativeBalanceKey } = useNativeBalance(mainnet.id);
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    mainnet.id,
  );

  const getVaultQueryKeys = ({
    peggedToken,
    stakingVaultAddress,
  }: Pick<Variables, "peggedToken" | "stakingVaultAddress">) => ({
    allowanceKey: allowanceQueryKey({
      owner: account,
      spender: stakingVaultAddress,
      token: { address: peggedToken.address, chainId: mainnet.id },
    }),
    peggedTokenBalanceKey: tokenBalanceQueryKey(peggedToken, account),
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
      const {
        approveAmount,
        assets,
        peggedToken,
        pendingHash,
        stakingVaultAddress,
      } = variables;
      if (!account || !isAddressEqual(account, variables.account)) {
        throw new Error("The connected account changed");
      }

      const {
        allowanceKey,
        peggedTokenBalanceKey,
        poolDepositsKey,
        stakedKey,
      } = getVaultQueryKeys({ peggedToken, stakingVaultAddress });

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
    async onSettled(_data, _error, { peggedToken, stakingVaultAddress }) {
      const {
        allowanceKey,
        peggedTokenBalanceKey,
        poolDepositsKey,
        sharesBalanceKey,
        stakedKey,
      } = getVaultQueryKeys({ peggedToken, stakingVaultAddress });

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
