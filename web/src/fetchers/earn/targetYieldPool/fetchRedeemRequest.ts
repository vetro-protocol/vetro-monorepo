import type { QueryClient } from "@tanstack/react-query";
import {
  getCancelableRedeemRequest,
  getClaimableRedeemRequest,
  getPendingRedeemRequest,
} from "@vetro-protocol/target-yield-earn/actions";
import { convertToAssetsQueryOptions } from "hooks/useConvertToAssets";
import type { Address, Client } from "viem";
import { maxRedeem, maxWithdraw } from "viem-erc4626/actions";

export type RedeemRequest = {
  cancelableShares: bigint;
  claimableAssets: bigint;
  claimableShares: bigint;
  maxRedeemShares: bigint;
  pendingAssets: bigint;
  pendingShares: bigint;
};

export const fetchRedeemRequest = async function ({
  client,
  controller,
  queryClient,
  stakingVaultAddress,
}: {
  client: Client;
  controller: Address;
  queryClient: QueryClient;
  stakingVaultAddress: Address;
}): Promise<RedeemRequest> {
  const ownerParams = { address: stakingVaultAddress, owner: controller };
  const params = { address: stakingVaultAddress, controller };
  const [
    cancelableShares,
    claimableAssets,
    claimableShares,
    maxRedeemShares,
    pendingShares,
  ] = await Promise.all([
    getCancelableRedeemRequest(client, params),
    maxWithdraw(client, ownerParams),
    getClaimableRedeemRequest(client, params),
    maxRedeem(client, ownerParams),
    getPendingRedeemRequest(client, params),
  ]);

  const pendingAssets =
    pendingShares > 0n
      ? await queryClient.ensureQueryData({
          ...convertToAssetsQueryOptions({
            client,
            shares: pendingShares,
            stakingVaultAddress,
          }),
          revalidateIfStale: true,
        })
      : 0n;

  return {
    cancelableShares,
    claimableAssets,
    claimableShares,
    maxRedeemShares,
    pendingAssets,
    pendingShares,
  };
};
