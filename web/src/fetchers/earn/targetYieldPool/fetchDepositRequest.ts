import {
  getCancelableDepositRequest,
  getClaimableDepositRequest,
  getMaxMint,
  getPendingDepositRequest,
} from "@vetro-protocol/target-yield-earn/actions";
import type { Address, Client } from "viem";
import { maxDeposit } from "viem-erc4626/actions";

export type DepositRequest = {
  cancelableAssets: bigint;
  claimableAssets: bigint;
  claimableShares: bigint;
  maxDepositAssets: bigint;
  pendingAssets: bigint;
};

export const fetchDepositRequest = async function ({
  client,
  controller,
  stakingVaultAddress,
}: {
  client: Client;
  controller: Address;
  stakingVaultAddress: Address;
}): Promise<DepositRequest> {
  const params = { address: stakingVaultAddress, controller };
  const [
    cancelableAssets,
    claimableAssets,
    claimableShares,
    maxDepositAssets,
    pendingAssets,
  ] = await Promise.all([
    getCancelableDepositRequest(client, params),
    getClaimableDepositRequest(client, params),
    getMaxMint(client, params),
    maxDeposit(client, { address: stakingVaultAddress, receiver: controller }),
    getPendingDepositRequest(client, params),
  ]);

  return {
    cancelableAssets,
    claimableAssets,
    claimableShares,
    maxDepositAssets,
    pendingAssets,
  };
};
