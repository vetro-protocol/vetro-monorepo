import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import { waitForTransactionReceipt } from "viem/actions";
import { withdraw } from "viem-erc4626/actions";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { stakedBalanceQueryKey } from "./useStakedBalance";
import { useVusd } from "./useVusd";

type InstantWithdrawStatus = "completed" | "failed" | "withdrawing";

type Params = {
  assets: bigint;
  onStatusChange?: (status: InstantWithdrawStatus) => void;
  onSuccess?: VoidFunction;
  onTransactionHash?: (hash: string) => void;
};

export const useInstantWithdraw = function ({
  assets,
  onStatusChange,
  onSuccess,
  onTransactionHash,
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
      queryClient.setQueryData(vusdBalanceKey, (old: bigint | undefined) =>
        old !== undefined ? old + assets : old,
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
