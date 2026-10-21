import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Token } from "@vetro-protocol/core";
import { claimRedeem } from "@vetro-protocol/target-yield-earn/actions";
import { emptyRedeemRequest } from "fetchers/earn/targetYieldPool/fetchRedeemRequest";
import { useEthereumWalletClient } from "hooks/useEthereumWalletClient";
import { getReceivedAmount } from "utils/receipt";
import { type Address, maxUint256, type TransactionReceipt } from "viem";
import { useAccount } from "wagmi";

import { useIsOpenToExit } from "./useIsOpenToExit";
import { redeemRequestQueryKey } from "./useRedeemRequest";

export type ClaimExitEmitter = ReturnType<typeof claimRedeem>["emitter"];

type Params = {
  onEmitter?: (emitter: ClaimExitEmitter) => void;
  peggedToken: Token;
  stakingVaultAddress: Address;
};

export const useClaimExit = function ({
  onEmitter,
  peggedToken,
  stakingVaultAddress,
}: Params) {
  const { chainId } = peggedToken;
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const queryClient = useQueryClient();

  const { queryKey: nativeBalanceKey } = useNativeBalance(chainId);
  const updateNativeBalanceAfterReceipt =
    useUpdateNativeBalanceAfterReceipt(chainId);

  const { data: isOpenToExit } = useIsOpenToExit(stakingVaultAddress);

  const redeemRequestKey = redeemRequestQueryKey({
    controller: account,
    isOpenToExit,
    stakingVaultAddress,
  });

  const peggedTokenBalanceKey = tokenBalanceQueryKey(peggedToken, account);

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }
      if (!walletClient) {
        throw new Error("No wallet client available");
      }

      await ensureConnectedTo(chainId);

      const { emitter, promise } = claimRedeem(walletClient, {
        address: stakingVaultAddress,
        controller: account,
        shares: maxUint256,
      });

      onEmitter?.(emitter);

      emitter.on(
        "claim-redeem-transaction-reverted",
        updateNativeBalanceAfterReceipt,
      );

      emitter.on(
        "claim-redeem-transaction-succeeded",
        function (receipt: TransactionReceipt) {
          updateNativeBalanceAfterReceipt(receipt);

          const assets = getReceivedAmount({ account, logs: receipt.logs });

          queryClient.setQueryData(redeemRequestKey, emptyRedeemRequest);
          queryClient.setQueryData(
            peggedTokenBalanceKey,
            (old: bigint | undefined) =>
              old !== undefined && assets !== undefined ? old + assets : old,
          );
        },
      );

      return promise;
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: nativeBalanceKey });
      queryClient.invalidateQueries({ queryKey: peggedTokenBalanceKey });
      queryClient.invalidateQueries({ queryKey: redeemRequestKey });
    },
  });
};
