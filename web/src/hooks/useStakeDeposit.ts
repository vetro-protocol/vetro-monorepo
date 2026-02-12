import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import { deposit } from "@vetro/earn/actions";
import type { TransactionReceipt } from "viem";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { stakedBalanceQueryKey } from "./useStakedBalance";
import { useVusd } from "./useVusd";

type DepositStatus =
  | "approve-failed"
  | "approved"
  | "approving"
  | "completed"
  | "deposit-failed"
  | "depositing";

type Params = {
  approveAmount?: bigint;
  assets: bigint;
  onStatusChange?: (status: DepositStatus) => void;
  onSuccess?: VoidFunction;
};

export const useStakeDeposit = function ({
  approveAmount,
  assets,
  onStatusChange,
  onSuccess,
}: Params) {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);
  const { queryKey: nativeBalanceKey } = useNativeBalance(chain.id);
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    chain.id,
  );
  const { data: vusd } = useVusd();

  const allowanceKey = allowanceQueryKey({
    owner: account,
    spender: stakingVaultAddress,
    token: { address: vusd?.address, chainId: chain.id },
  });

  const vusdBalanceKey = tokenBalanceQueryKey(vusd, account);

  const sharesBalanceKey = tokenBalanceQueryKey(
    { address: stakingVaultAddress, chainId: chain.id },
    account,
  );

  const stakedKey = stakedBalanceQueryKey({
    account: account!,
    chainId: chain.id,
    stakingVaultAddress,
  });

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }
      if (!vusd) {
        throw new Error("VUSD token not loaded");
      }

      await ensureConnectedTo(chain.id);

      const { emitter, promise } = deposit(walletClient!, {
        approveAmount,
        assets,
        receiver: account,
        token: vusd.address,
      });

      emitter.on("user-signed-approval", function () {
        onStatusChange?.("approving");
      });

      emitter.on("approve-transaction-succeeded", function () {
        onStatusChange?.("approved");
      });

      emitter.on("user-signed-deposit", function () {
        onStatusChange?.("depositing");
      });

      emitter.on("deposit-transaction-succeeded", function () {
        onStatusChange?.("completed");
        onSuccess?.();
      });

      emitter.on("user-signing-approval-error", function () {
        onStatusChange?.("approve-failed");
      });

      emitter.on(
        "approve-transaction-reverted",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange?.("approve-failed");
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
        onStatusChange?.("deposit-failed");
      });

      emitter.on(
        "deposit-transaction-reverted",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
          onStatusChange?.("deposit-failed");
        },
      );

      emitter.on(
        "deposit-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);

          // Optimistically update balances
          queryClient.setQueryData(vusdBalanceKey, (old: bigint | undefined) =>
            old !== undefined ? old - assets : old,
          );
          queryClient.setQueryData(stakedKey, (old: bigint | undefined) =>
            old !== undefined ? old + assets : old,
          );
        },
      );

      return promise;
    },
    async onSettled() {
      queryClient.invalidateQueries({
        queryKey: allowanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: vusdBalanceKey,
      });

      // Shares must be refetched before staked balance, because
      // useStakedBalance uses ensureQueryData to read shares from cache
      await queryClient.invalidateQueries({
        queryKey: sharesBalanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: stakedKey,
      });
    },
  });
};
