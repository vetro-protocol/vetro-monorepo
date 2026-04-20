import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Token } from "types";
import type { Address } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { withdraw } from "viem-erc4626/actions";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { stakedBalanceQueryKey } from "./useStakedBalance";
import { totalStakedUsdQueryKey } from "./useTotalStakedUsd";

type InstantWithdrawStatus = "completed" | "failed" | "withdrawing";

type Params = {
  assets: bigint;
  onStatusChange?: (status: InstantWithdrawStatus) => void;
  onSuccess?: VoidFunction;
  onTransactionHash?: (hash: string) => void;
  peggedToken: Token;
  stakingVaultAddress: Address;
};

export const useInstantWithdraw = function ({
  assets,
  onStatusChange,
  onSuccess,
  onTransactionHash,
  peggedToken,
  stakingVaultAddress,
}: Params) {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();

  const { queryKey: nativeBalanceKey } = useNativeBalance(chain.id);
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    chain.id,
  );

  const peggedTokenBalanceKey = tokenBalanceQueryKey(peggedToken, account);

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

      await ensureConnectedTo(chain.id);

      const hash = await withdraw(walletClient!, {
        address: stakingVaultAddress,
        assets,
        owner: account,
        receiver: account,
      });

      onTransactionHash?.(hash);
      onStatusChange?.("withdrawing");

      const receipt = await waitForTransactionReceipt(walletClient!, {
        hash,
      });

      updateNativeBalanceAfterReceipt(receipt);

      if (receipt.status === "reverted") {
        onStatusChange?.("failed");
        return;
      }
      onStatusChange?.("completed");
      onSuccess?.();

      // Optimistically update balances
      queryClient.setQueryData(
        peggedTokenBalanceKey,
        (old: bigint | undefined) => (old !== undefined ? old + assets : old),
      );
      queryClient.setQueryData(stakedKey, (old: bigint | undefined) =>
        old !== undefined ? old - assets : old,
      );
    },
    onError() {
      onStatusChange?.("failed");
    },
    async onSettled() {
      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: peggedTokenBalanceKey,
      });

      // Shares must be refetched before staked balance, because
      // useStakedBalance uses ensureQueryData to read shares from cache.
      // refetchQueries (not invalidateQueries) is required because the
      // shares query has no mounted observer — invalidation alone would
      // only mark it stale, and ensureQueryData returns stale cached data.
      await queryClient.refetchQueries({
        queryKey: sharesBalanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: stakedKey,
      });

      queryClient.invalidateQueries({
        queryKey: totalStakedUsdQueryKey({ account, chainId: chain.id }),
      });
    },
  });
};
