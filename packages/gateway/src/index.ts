import type { Client, WalletClient } from "viem";

import {
  getPeggedToken,
  getMintFee,
  getRedeemFee,
  getWithdrawalDelay,
  getWithdrawalDelayEnabled,
  isInstantRedeemWhitelisted,
  previewDeposit,
  previewRedeem,
} from "./actions/public/index.js";
import { type DepositParams, deposit } from "./actions/wallet/deposit.js";
import { type RedeemParams, redeem } from "./actions/wallet/redeem.js";

// Export ABI
export { gatewayAbi } from "./abi/gatewayAbi.js";

// Export gateway address utility
export { getGatewayAddress } from "./getGatewayAddress.js";

// Export factory functions for .extend() pattern
export const gatewayPublicActions = () => (client: Client) => ({
  getMintFee: (params: Parameters<typeof getMintFee>[1]) =>
    getMintFee(client, params),
  getPeggedToken: (params: Parameters<typeof getPeggedToken>[1]) =>
    getPeggedToken(client, params),
  getRedeemFee: (params: Parameters<typeof getRedeemFee>[1]) =>
    getRedeemFee(client, params),
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
  deposit: (params: DepositParams) => deposit(client, params),
  redeem: (params: RedeemParams) => redeem(client, params),
});
