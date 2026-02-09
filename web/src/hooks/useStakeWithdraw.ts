import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import { requestWithdraw } from "@vetro/earn/actions";
import type { TransactionReceipt } from "viem";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";
import { stakedBalanceQueryKey } from "./useStakedBalance";

type Params = {
  assets: bigint;
};

export const useStakeWithdraw = function ({ assets }: Params) {
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

      const { emitter, promise } = requestWithdraw(walletClient!, {
        assets,
        owner: account,
      });

      emitter.on(
        "request-withdraw-transaction-reverted",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);
        },
      );

      emitter.on(
        "request-withdraw-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);

          // Optimistically update staked balance
          queryClient.setQueryData(stakedKey, (old: bigint | undefined) =>
            old !== undefined ? old - assets : old,
          );
        },
      );

      return promise;
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });

      queryClient.invalidateQueries({
        queryKey: stakedKey,
      });
    },
  });
};
