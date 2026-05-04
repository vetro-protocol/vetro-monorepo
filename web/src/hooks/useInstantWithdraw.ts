import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TokenWithGateway } from "types";
import type { Address } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { withdraw } from "viem-erc4626/actions";
import { useAccount } from "wagmi";

import { analyticsTotalsQueryKey } from "./useAnalyticsTotals";
import { averagePurchasePriceQueryKey } from "./useAveragePurchasePrice";
import { earnedAmountUsdQueryKey } from "./useEarnedAmountUsd";
import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { poolDepositsQueryKey } from "./usePoolDeposits";
import { stakedBalanceQueryKey } from "./useStakedBalance";
import { totalStakedUsdQueryKey } from "./useTotalStakedUsd";

type InstantWithdrawStatus = "completed" | "failed" | "withdrawing";

type Params = {
  assets: bigint;
  onStatusChange?: (status: InstantWithdrawStatus) => void;
  onSuccess?: VoidFunction;
  onTransactionHash?: (hash: string) => void;
  peggedToken: TokenWithGateway;
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

  const poolDepositsKey = poolDepositsQueryKey({
    chainId: chain.id,
    stakingVaultAddress,
  });

  const analyticsTotalsKey = analyticsTotalsQueryKey({
    chainId: chain.id,
    gatewayAddress: peggedToken.gatewayAddress,
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
      queryClient.setQueryData(poolDepositsKey, (old: bigint | undefined) =>
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

      // Refetch (not just invalidate) the queries that downstream fetchers
      // read via ensureQueryData: shares feed useStakedBalance, and avg
      // purchase price feeds fetchEarnedAmountUsd. Neither has a mounted
      // observer, so invalidation alone would leave them stale.
      await Promise.all([
        queryClient.refetchQueries({ queryKey: sharesBalanceKey }),
        queryClient.refetchQueries({
          queryKey: averagePurchasePriceQueryKey(account),
        }),
      ]);

      queryClient.invalidateQueries({
        queryKey: stakedKey,
      });

      queryClient.invalidateQueries({
        queryKey: totalStakedUsdQueryKey({ account, chainId: chain.id }),
      });

      queryClient.invalidateQueries({
        queryKey: earnedAmountUsdQueryKey({ account, chainId: chain.id }),
      });

      queryClient.invalidateQueries({
        queryKey: poolDepositsKey,
      });

      queryClient.invalidateQueries({
        queryKey: analyticsTotalsKey,
      });
    },
  });
};
