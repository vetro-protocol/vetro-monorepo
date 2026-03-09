import { allowanceQueryKey } from "@hemilabs/react-hooks/useAllowance";
import { useEnsureConnectedTo } from "@hemilabs/react-hooks/useEnsureConnectedTo";
import { tokenBalanceQueryKey } from "@hemilabs/react-hooks/useTokenBalance";
import { useUpdateNativeBalanceAfterReceipt } from "@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt";
import { getChainAddresses } from "@morpho-org/blue-sdk";
import type { AccrualPosition } from "@morpho-org/blue-sdk-viem/lib/augment/Position";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  morphoBlueAbi,
  type SupplyCollateralAndBorrowEvents,
} from "@vetro/morpho-blue-market";
import { supplyCollateralAndBorrow } from "@vetro/morpho-blue-market/actions";
import type { EventEmitter } from "events";
import { parseEventLogs, type Hash } from "viem";
import { useAccount } from "wagmi";

import { useEthereumWalletClient } from "../useEthereumWalletClient";
import { useMainnet } from "../useMainnet";

import { morphoMarketOptions, morphoMarketQueryKey } from "./useMorphoMarket";
import { positionInfoQueryKey } from "./usePositionInfo";

export const useSupplyAndBorrow = function ({
  approveAmount,
  borrowAmount,
  collateralAmount,
  marketId,
  onEmitter,
}: {
  approveAmount?: bigint;
  borrowAmount: bigint;
  collateralAmount: bigint;
  marketId: Hash;
  onEmitter?: (emitter: EventEmitter<SupplyCollateralAndBorrowEvents>) => void;
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

      const { emitter, promise } = supplyCollateralAndBorrow(walletClient!, {
        address: morphoAddress,
        approveAmount,
        borrowAmount,
        collateralAmount,
        marketId,
        onBehalf: account,
        receiver: account,
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
        // Remove collateral token from user's wallet.
        // For updating the collateral position, see after borrowing is completed
        queryClient.setQueryData(
          collateralBalanceKey,
          (old: bigint) => old - collateralAmount,
        );
      });
      emitter.on("borrow-assets-transaction-reverted", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
      });
      emitter.on("borrow-assets-transaction-succeeded", function (receipt) {
        updateNativeBalanceAfterReceipt(receipt);
        // Update the collateral position here (After borrowing has succeeded) instead of after supplying collateral
        // as once the position is created, the Form would show "You already have a position". If we don't do it this way
        // the form would disappear mid-flow
        queryClient.setQueryData(
          positionInfoKey,
          (old: AccrualPosition | undefined) =>
            old?.supplyCollateral(collateralAmount),
        );

        const events = parseEventLogs({
          abi: morphoBlueAbi,
          eventName: "Borrow",
          logs: receipt.logs,
        });
        if (events.length > 0) {
          const { assets, shares } = events[0].args;
          const loanBalanceKey = tokenBalanceQueryKey(
            { address: market.params.loanToken, chainId: ethereumChain.id },
            account,
          );
          // update balance adding borrowed assets in the wallet
          queryClient.setQueryData(
            loanBalanceKey,
            (old: bigint) => old + assets,
          );
          // and in the position
          queryClient.setQueryData(
            positionInfoKey,
            (old: AccrualPosition | undefined) =>
              old?.borrow(assets, shares).position,
          );
        }
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
        queryClient.invalidateQueries({
          queryKey: allowanceQueryKey({
            owner: account,
            spender: getChainAddresses(ethereumChain.id).morpho,
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

        queryClient.invalidateQueries({
          queryKey: tokenBalanceQueryKey(
            { address: market.params.loanToken, chainId: ethereumChain.id },
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
        queryKey: morphoMarketQueryKey({
          chainId: ethereumChain.id,
          marketId,
        }),
      });
    },
  });
};
