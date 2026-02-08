import type { Client, WalletClient } from "viem";

import {
  getActiveRequestIds,
  getClaimableRequests,
  getCooldownDuration,
  getCooldownEnabled,
  getPendingRequests,
  getRequestDetails,
  getTotalAssetsInCooldown,
} from "./actions/public/index.js";
import {
  type CancelWithdrawParams,
  cancelWithdraw,
} from "./actions/wallet/cancelWithdraw.js";
import {
  type ClaimWithdrawParams,
  claimWithdraw,
} from "./actions/wallet/claimWithdraw.js";
import {
  type ClaimWithdrawBatchParams,
  claimWithdrawBatch,
} from "./actions/wallet/claimWithdrawBatch.js";
import { type DepositParams, deposit } from "./actions/wallet/deposit.js";
import {
  type RequestRedeemParams,
  requestRedeem,
} from "./actions/wallet/requestRedeem.js";
import {
  type RequestWithdrawParams,
  requestWithdraw,
} from "./actions/wallet/requestWithdraw.js";

// Export ABI
export { stakingVaultAbi } from "./abi/stakingVaultAbi.js";

// Export staking vault address utility
export { getStakingVaultAddress } from "./getStakingVaultAddress.js";

// Export wallet actions directly for use outside of .extend() pattern
export { deposit } from "./actions/wallet/deposit.js";
export type { DepositParams } from "./actions/wallet/deposit.js";
export { requestWithdraw } from "./actions/wallet/requestWithdraw.js";
export type { RequestWithdrawParams } from "./actions/wallet/requestWithdraw.js";

// Export types
export type {
  CancelWithdrawEvents,
  ClaimWithdrawBatchEvents,
  ClaimWithdrawEvents,
  CooldownRequest,
  DepositEvents,
  RequestRedeemEvents,
  RequestWithdrawEvents,
} from "./types.js";

// Export factory functions for .extend() pattern
export const earnPublicActions = () => (client: Client) => ({
  getActiveRequestIds: (params: Parameters<typeof getActiveRequestIds>[1]) =>
    getActiveRequestIds(client, params),
  getClaimableRequests: (params: Parameters<typeof getClaimableRequests>[1]) =>
    getClaimableRequests(client, params),
  getCooldownDuration: (params: Parameters<typeof getCooldownDuration>[1]) =>
    getCooldownDuration(client, params),
  getCooldownEnabled: (params: Parameters<typeof getCooldownEnabled>[1]) =>
    getCooldownEnabled(client, params),
  getPendingRequests: (params: Parameters<typeof getPendingRequests>[1]) =>
    getPendingRequests(client, params),
  getRequestDetails: (params: Parameters<typeof getRequestDetails>[1]) =>
    getRequestDetails(client, params),
  getTotalAssetsInCooldown: (
    params: Parameters<typeof getTotalAssetsInCooldown>[1],
  ) => getTotalAssetsInCooldown(client, params),
});

export const earnWalletActions = () => (client: WalletClient) => ({
  cancelWithdraw: (params: CancelWithdrawParams) =>
    cancelWithdraw(client, params),
  claimWithdraw: (params: ClaimWithdrawParams) => claimWithdraw(client, params),
  claimWithdrawBatch: (params: ClaimWithdrawBatchParams) =>
    claimWithdrawBatch(client, params),
  deposit: (params: DepositParams) => deposit(client, params),
  requestRedeem: (params: RequestRedeemParams) => requestRedeem(client, params),
  requestWithdraw: (params: RequestWithdrawParams) =>
    requestWithdraw(client, params),
});
