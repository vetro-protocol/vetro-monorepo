import type { Client, WalletClient } from "viem";

import {
  getGateway,
  getMaxMint,
  getMaxWithdraw,
  getMintFee,
  getPeggedToken,
  getRedeemFee,
  getRedeemRequest,
  getTreasury,
  getWithdrawalDelay,
  getWithdrawalDelayEnabled,
  isInstantRedeemWhitelisted,
  previewDeposit,
  previewRedeem,
  previewWithdraw,
} from "./actions/public/index.ts";
import {
  type CancelRedeemRequestParams,
  cancelRedeemRequest,
} from "./actions/wallet/cancelRedeemRequest.ts";
import { type DepositParams, deposit } from "./actions/wallet/deposit.ts";
import { type RedeemParams, redeem } from "./actions/wallet/redeem.ts";
import {
  type RequestRedeemParams,
  requestRedeem,
} from "./actions/wallet/requestRedeem.ts";

// Export ABI
export { gatewayAbi } from "./abi/gatewayAbi.ts";
// Export gateway addresses and per-gateway peg-base metadata
export {
  type Gateway,
  gatewayAddresses,
  gateways,
} from "./gatewayAddresses.ts";

export type { CancelRedeemRequestParams };

export {
  type CancelRedeemRequestEvents,
  type DepositEvents,
  type RedeemEvents,
  type RequestRedeemEvents,
} from "./types.ts";

// Export factory functions for .extend() pattern
export const gatewayPublicActions = () => (client: Client) => ({
  getGateway: (params: Parameters<typeof getGateway>[1]) =>
    getGateway(client, params),
  getMaxMint: (params: Parameters<typeof getMaxMint>[1]) =>
    getMaxMint(client, params),
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
  previewWithdraw: (params: Parameters<typeof previewWithdraw>[1]) =>
    previewWithdraw(client, params),
});

export const gatewayWalletActions = () => (client: WalletClient) => ({
  cancelRedeemRequest: (params: CancelRedeemRequestParams) =>
    cancelRedeemRequest(client, params),
  deposit: (params: DepositParams) => deposit(client, params),
  redeem: (params: RedeemParams) => redeem(client, params),
  requestRedeem: (params: RequestRedeemParams) => requestRedeem(client, params),
});
