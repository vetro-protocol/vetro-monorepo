import type { Client, WalletClient } from "viem";

import {
  getPeggedToken,
  getMintFee,
  getRedeemFee,
  getWithdrawalDelayEnabled,
  isInstantRedeemWhitelisted,
  previewDeposit,
  previewRedeem,
} from "./actions/public/index.js";
import { deposit, redeem } from "./actions/wallet/index.js";

// Export ABI
export { gatewayAbi } from "./abi/gatewayAbi.js";

// Export factory functions for .extend() pattern
export const gatewayPublicActions = () => (client: Client) => ({
  getMintFee: (params: Parameters<typeof getMintFee>[1]) =>
    getMintFee(client, params),
  getPeggedToken: (params: Parameters<typeof getPeggedToken>[1]) =>
    getPeggedToken(client, params),
  getRedeemFee: (params: Parameters<typeof getRedeemFee>[1]) =>
    getRedeemFee(client, params),
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
  deposit: (params: Parameters<typeof deposit>[1]) => deposit(client, params),
  redeem: (params: Parameters<typeof redeem>[1]) => redeem(client, params),
});
