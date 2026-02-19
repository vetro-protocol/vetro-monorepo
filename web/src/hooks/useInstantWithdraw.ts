import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import { exitTicketsQueryKey } from "pages/earn/hooks/useExitTickets";
import { waitForTransactionReceipt } from "viem/actions";
import { withdraw } from "viem-erc4626/actions";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { stakedBalanceQueryKey } from "./useStakedBalance";

type InstantWithdrawStatus = "completed" | "failed" | "withdrawing";

type Params = {
  assets: bigint;
  onStatusChange?: (status: InstantWithdrawStatus) => void;
  onSuccess?: VoidFunction;
};

export const useInstantWithdraw = function ({
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

      onStatusChange?.("withdrawing");

      const receipt = await waitForTransactionReceipt(walletClient!, {
        hash,
      });

      if (receipt.status === "reverted") {
        updateNativeBalanceAfterReceipt(receipt);
        onStatusChange?.("failed");
        return;
      }

      updateNativeBalanceAfterReceipt(receipt);
      onStatusChange?.("completed");
      onSuccess?.();

      // Optimistically update staked balance
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

      // Shares must be refetched before staked balance, because
      // useStakedBalance uses ensureQueryData to read shares from cache
      await queryClient.invalidateQueries({
        queryKey: sharesBalanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: stakedKey,
      });

      queryClient.invalidateQueries({
        queryKey: exitTicketsQueryKey(account),
      });
    },
  });
};
