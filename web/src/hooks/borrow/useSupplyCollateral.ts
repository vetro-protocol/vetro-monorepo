import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { getChainAddresses } from "@morpho-org/blue-sdk";
import type { AccrualPosition } from "@morpho-org/blue-sdk-viem/lib/augment/Position";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupplyCollateralEvents } from "@vetro/morpho-blue-market";
import { supplyCollateral } from "@vetro/morpho-blue-market/actions";
import type { EventEmitter } from "events";
import type { Hash } from "viem";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "../useEthereumWalletClient";
import { useMainnet } from "../useMainnet";

import { marketCollateralQueryKey } from "./useMarketCollateral";
import { morphoMarketOptions } from "./useMorphoMarket";
import { positionInfoQueryKey } from "./usePositionInfo";

export const useSupplyCollateral = function ({
  approveAmount,
  collateralAmount,
  marketId,
  onEmitter,
}: {
  approveAmount?: bigint;
  collateralAmount: bigint;
  marketId: Hash;
  onEmitter?: (emitter: EventEmitter<SupplyCollateralEvents>) => void;
}) {
  const { address: account } = useAccount();
  const { data: walletClient } = useEthereumWalletClient();
  const ensureConnectedTo = useEnsureConnectedTo();
  const ethereumChain = useMainnet();
  const queryClient = useQueryClient();
  const updateNativeBalanceAfterReceipt = useUpdateNativeBalanceAfterReceipt(
    ethereumChain.id,
  );

  return useMutation({
    async mutationFn() {
      if (!account) {
        throw new Error("No account connected");
      }

      await ensureConnectedTo(ethereumChain.id);

      const market = await queryClient.ensureQueryData(
        morphoMarketOptions({
          chainId: ethereumChain.id,
          client: walletClient!,
          marketId,
        }),
      );

      const morphoAddress = getChainAddresses(ethereumChain.id).morpho;

      const collateralBalanceKey = tokenBalanceQueryKey(
        { address: market.params.collateralToken, chainId: ethereumChain.id },
        account,
      );

      const positionInfoKey = positionInfoQueryKey({
        account,
        chainId: ethereumChain.id,
        marketId,
      });

      const { emitter, promise } = supplyCollateral(walletClient!, {
        address: morphoAddress,
        amount: collateralAmount,
        approveAmount,
        marketId,
        onBehalf: account,
      });

      onEmitter?.(emitter);

      emitter.on("approve-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("approve-transaction-succeeded", function (receipt) {
        const allowanceKey = allowanceQueryKey({
          owner: account,
          spender: morphoAddress,
          token: {
            address: market.params.collateralToken,
            chainId: ethereumChain.id,
          },
        });

        updateNativeBalanceAfterReceipt(receipt);
        queryClient.invalidateQueries({ queryKey: allowanceKey });
      });
      emitter.on("supply-collateral-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("supply-collateral-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
        // Remove collateral token from user's wallet
        queryClient.setQueryData(
          collateralBalanceKey,
          (old: bigint) => old - collateralAmount,
        );
        // Update position's collateral
        queryClient.setQueryData(
          positionInfoKey,
          (old: AccrualPosition | undefined) =>
            old?.supplyCollateral(collateralAmount),
        );
        // Update market's total collateral
        queryClient.setQueryData(
          marketCollateralQueryKey(marketId),
          (old: bigint) => old + collateralAmount,
        );
      });

      return promise;
    },
    onSettled() {
      const marketOptions = morphoMarketOptions({
        chainId: ethereumChain.id,
        client: walletClient,
        marketId,
      });
      // should be available in the cache since the mutation requires it
      const market = queryClient.getQueryData(marketOptions.queryKey);

      if (market) {
        const morphoAddress = getChainAddresses(ethereumChain.id).morpho;

        queryClient.invalidateQueries({
          queryKey: allowanceQueryKey({
            owner: account,
            spender: morphoAddress,
            token: {
              address: market.params.collateralToken,
              chainId: ethereumChain.id,
            },
          }),
        });

        queryClient.invalidateQueries({
          queryKey: tokenBalanceQueryKey(
            {
              address: market.params.collateralToken,
              chainId: ethereumChain.id,
            },
            account,
          ),
        });
      }

      queryClient.invalidateQueries({
        queryKey: positionInfoQueryKey({
          account,
          chainId: ethereumChain.id,
          marketId,
        }),
      });

      queryClient.invalidateQueries({
        queryKey: marketCollateralQueryKey(marketId),
      });
    },
  });
};
