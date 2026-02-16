import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStakingVaultAddress, type RequestRedeemEvents } from "@vetro/earn";
import { requestRedeem } from "@vetro/earn/actions";
import type { EventEmitter } from "events";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "./useEthereumWalletClient";
import { useMainnet } from "./useMainnet";

export const useRequestRedeem = function ({
  onEmitter,
  shares,
}: {
  onEmitter?: (emitter: EventEmitter<RequestRedeemEvents>) => void;
  shares: bigint;
}) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const ethereumChain = useMainnet();
  const { queryKey: nativeBalanceKey } = useNativeBalance(ethereumChain.id);
  const queryClient = useQueryClient();
  const stakingVaultAddress = getStakingVaultAddress(ethereumChain.id);

  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    ethereumChain.id,
  );

  const sharesBalanceKey = tokenBalanceQueryKey(
    { address: stakingVaultAddress, chainId: ethereumChain.id },
    account,
  );

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }

      await ensureConnectedTo(ethereumChain.id);

      const { emitter, promise } = requestRedeem(walletClient!, {
        owner: account,
        shares,
      });

      emitter.on("request-redeem-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("request-redeem-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
        queryClient.setQueryData(
          sharesBalanceKey,
          (old: bigint) => old - shares,
        );
      });

      onEmitter?.(emitter);

      return promise;
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: nativeBalanceKey,
      });
      queryClient.invalidateQueries({
        queryKey: sharesBalanceKey,
      });
    },
  });
};
