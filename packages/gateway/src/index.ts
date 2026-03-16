import type { Client, WalletClient } from "viem";

import {
  getMaxWithdraw,
  getMintFee,
  getPeggedToken,
  getRedeemFee,
  getRedeemRequest,
  getTreasury,
  getWhitelistedTokens,
  getWithdrawalDelay,
  getWithdrawalDelayEnabled,
  isInstantRedeemWhitelisted,
  previewDeposit,
  previewRedeem,
} from "./actions/public/index.js";
import { cancelRedeemRequest } from "./actions/wallet/cancelRedeemRequest.js";
import { type DepositParams, deposit } from "./actions/wallet/deposit.js";
import { type RedeemParams, redeem } from "./actions/wallet/redeem.js";
import {
  type RequestRedeemParams,
  requestRedeem,
} from "./actions/wallet/requestRedeem.js";

// Export ABI
export { gatewayAbi } from "./abi/gatewayAbi.js";
export { treasuryAbi } from "./abi/treasuryAbi.js";

// Export gateway address utility
export { getGatewayAddress } from "./getGatewayAddress.js";

export {
  type CancelRedeemRequestEvents,
  type DepositEvents,
  type RedeemEvents,
  type RequestRedeemEvents,
} from "./types.js";

// Export factory functions for .extend() pattern
export const gatewayPublicActions = () => (client: Client) => ({
  getMaxWithdraw: (params: Parameters<typeof getMaxWithdraw>[1]) =>
    getMaxWithdraw(client, params),
  getMintFee: (params: Parameters<typeof getMintFee>[1]) =>
    getMintFee(client, params),
  getPeggedToken: (params: Parameters<typeof getPeggedToken>[1]) =>
    getPeggedToken(client, params),
  getRedeemFee: (params: Parameters<typeof getRedeemFee>[1]) =>
    getRedeemFee(client, params),
  getRedeemRequest: (params: Parameters<typeof getRedeemRequest>[1]) =>
    getRedeemRequest(client, params),
  getTreasury: (params: Parameters<typeof getTreasury>[1]) =>
    getTreasury(client, params),
  getWhitelistedTokens: (params: Parameters<typeof getWhitelistedTokens>[1]) =>
    getWhitelistedTokens(client, params),
  getWithdrawalDelay: (params: Parameters<typeof getWithdrawalDelay>[1]) =>
    getWithdrawalDelay(client, params),
  getWithdrawalDelayEnabled: (
    params: Parameters<typeof getWithdrawalDelayEnabled>[1],
  ) => getWithdrawalDelayEnabled(client, params),
  isInstantRedeemWhitelisted: (
    params: Parameters<typeof isInstantRedeemWhitelisted>[1],
  ) => isInstantRedeemWhitelisted(client, params),
  previewDeposit: (params: Parameters<typeof previewDeposit>[1]) =>
    previewDeposit(client, params),
  previewRedeem: (params: Parameters<typeof previewRedeem>[1]) =>
    previewRedeem(client, params),
});

export const gatewayWalletActions = () => (client: WalletClient) => ({
  cancelRedeemRequest: () => cancelRedeemRequest(client),
  deposit: (params: DepositParams) => deposit(client, params),
  redeem: (params: RedeemParams) => redeem(client, params),
  requestRedeem: (params: RequestRedeemParams) => requestRedeem(client, params),
});
